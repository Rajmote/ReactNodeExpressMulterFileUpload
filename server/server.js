const express = require('express');
var multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());

// Helper function to generate unique filename
const generateUniqueFilename = (originalName) => {
    const extension = path.extname(originalName); // Get the file extension
    const nameWithoutExt = path.basename(originalName, extension); // Get the filename without the extension
    const timestamp = new Date().toISOString().replace(/[-:.T]/g, ''); // Generate datetime as YYYYMMDDHHMMSS
    return `${nameWithoutExt}_${timestamp}${extension}`; // Append datetime to the filename
};

// Set up Multer for file uploads
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        const uniqueFilename = generateUniqueFilename(file.originalname);
        cb(null, uniqueFilename); // Set the filename with appended datetime
    }
});

var upload = multer({ storage: storage });

// Serve static files
app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static('uploads'));

// Function to delete all files in the uploads folder
const deleteAllFiles = () => {
    const uploadDir = path.join(__dirname, 'uploads');

    // Read the directory contents
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        if (files.length === 0) {
            console.log('No files to delete');
            return;
        }

        // Iterate through the files and delete each one
        files.forEach(file => {
            const filePath = path.join(uploadDir, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file: ${filePath}`, err);
                } else {
                    console.log(`Deleted file: ${filePath}`);
                }
            });
        });

        console.log('All files deleted successfully');
    });
};

// File upload (single)
app.post('/file', upload.single('file'), function (req, res, next) {
    console.log(JSON.stringify(req.file));
    return res.json({ message: 'File uploaded successfully', filename: req.file.filename }); // Send back the unique filename in the response
});

// File upload (multiple)
app.post('/files', upload.array('files', 12), function (req, res, next) {
    let response = {
        message: "Files uploaded successfully",
        filenames: []
    };
    req.files.forEach(file => {
        response.filenames.push(file.filename); // Collect all filenames
    });
    return res.json(response); // Send back filenames in response
});

// Read operation: Fetch a file by filename
app.get('/file/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', fileName);

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Serve the file for download or viewing
        res.sendFile(filePath);
    });
});

// Delete operation: Delete a file by filename
app.delete('/file/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', fileName);

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete the file
        fs.unlink(filePath, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error deleting file' });
            }
            res.json({ message: `File '${fileName}' deleted successfully` });
        });
    });
});

// Delete all files in the uploads folder
app.delete('/files', (req, res) => {
    deleteAllFiles();
    // const uploadDir = path.join(__dirname, 'uploads');
    // // Read the directory contents
    // fs.readdir(uploadDir, (err, files) => {
    //     if (err) {
    //         return res.status(500).json({ error: 'Error reading directory' });
    //     }

    //     if (files.length === 0) {
    //         return res.status(404).json({ message: 'No files to delete' });
    //     }

    //     // Iterate through the files and delete each one
    //     files.forEach(file => {
    //         const filePath = path.join(uploadDir, file);
    //         fs.unlink(filePath, (err) => {
    //             if (err) {
    //                 console.error(`Error deleting file: ${filePath}`);
    //             }
    //         });
    //     });

    //     res.json({ message: 'All files deleted successfully' });
    // });
});

// Set interval to delete all files every 30 minutes (1800000 ms)
setInterval(deleteAllFiles, 3 * 60 * 1000);

// Define an API endpoint for testing
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Server is connected !!! Hello from server!' });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// const express = require('express');
// var multer  = require('multer');
// const cors = require('cors');
// const bodyParser = require('body-parser');

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Enable CORS
// app.use(cors());

// // Parse JSON bodies
// app.use(bodyParser.json());

// var storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, './uploads')
//     },
//     filename: function (req, file, cb) {
//       cb(null, file.originalname)
//     }
// })

// var upload = multer({ storage: storage });

// /*
// app.use('/a',express.static('/b'));
// Above line would serve all files/folders inside of the 'b' directory
// And make them accessible through http://localhost:3000/a.
// */
// app.use(express.static(__dirname + '/public'));
// app.use('/uploads', express.static('uploads'));

// app.post('/profile-upload-single', upload.single('profile-file'), function (req, res, next) {
//   // req.file is the `profile-file` file
//   // req.body will hold the text fields, if there were any
//   console.log(JSON.stringify(req.file))
//   var response = '<a href="/">Home</a><br>'
//   response += "Files uploaded successfully.<br>"
//   response += `<img src="${req.file.path}" /><br>`
//   return res.send(response)
// })

// app.post('/profile-upload-multiple', upload.array('profile-files', 12), function (req, res, next) {
//     // req.files is array of `profile-files` files
//     // req.body will contain the text fields, if there were any
//     console.log(JSON.stringify(req.file))
//     var response = '<a href="/">Home</a><br>'
//     response += "Files uploaded successfully.<br>"
//     for(var i=0;i<req.files.length;i++){
//         response += `<img src="${req.files[i].path}" /><br>`
//     }
    
//     return res.send(response)
// })


// // Define an API endpoint
// app.get('/api/hello', (req, res) => {
//   res.json({ message: 'Hello from server!' });
// });

// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });



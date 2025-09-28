// --- MODULE IMPORTS ---
const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); // Used for token-based authentication (JWT)
const multer = require("multer");   // Used for handling 'multipart/form-data' (file uploads)
const path = require("path");       // Used for resolving file paths
const cors = require("cors");       // Used to enable Cross-Origin Resource Sharing
const e = require("express");

// --- MIDDLEWARE SETUP ---
app.use(express.json()); // Middleware: Parses incoming requests with JSON payloads
app.use(cors());         // Middleware: Allows requests from different domains (e.g., your React frontend on a different port)

// --- DATABASE CONNECTION ---
const mongoDB_URL = 'mongodb+srv://ALJA:Alka%404950@cluster0.nwiyytc.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoDB_URL)
    .then(() => {
        console.log('Connection established');
    })
    .catch((err) => {
        console.log('Error in connection:', err);
    });

// --- ROOT API ENDPOINT ---
// Simple root endpoint to verify the server is running
app.get("/", (req, res) => {
    res.send("Express App is running");
});

// --- IMAGE STORAGE SETUP ---

// Serves static files from the 'upload/images' directory when '/images' is requested
app.use('/images', express.static('upload/images'));

// Configuration for Multer (Image Storage Engine)
const storage = multer.diskStorage({
    // Specifies the destination directory for uploaded files
    destination: './upload/images',
    // Defines how the file should be named
    filename: (req, file, cb) => {
        // Creates a unique filename: 'product_timestamp.ext'
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});
// Creates the Multer upload instance using the defined storage configuration
const upload = multer({ storage: storage });

// --- UPLOAD ENDPOINT (C: Create File) ---
// Endpoint to handle the file upload. 'upload.single('product')' processes the file
// from the field named 'product' in the form data.
app.post("/upload", upload.single('product'), (req, res) => {
    // Check if the file was successfully uploaded by Multer
    if (!req.file) {
        return res.status(400).json({ success: 0, message: "No file uploaded or file upload failed." });
    }
    // Responds with a success status and the URL where the image can be accessed
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    });
});

// --- MONGODB SCHEMA DEFINITION ---

// Defines the structure and data types for the 'Product' document in MongoDB
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    new_price: {
        type: Number,
        required: true
    },
    old_price: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now // Sets the product creation date automatically
    },
    available: {
        type: Boolean,
        default: true
    }
});

// --- API ENDPOINTS (CRUD) ---

// 1. ADD PRODUCT ENDPOINT (C: Create Product Document)
// Handles creation of a new product document in the database
app.post("/addproduct", async (req, res) => {
    // Fetch all existing products to determine the new product ID
    let products = await Product.find({});
    let id;

    // Logic to generate a sequential ID (Last Product ID + 1)
    if (products.length > 0) {
        let last_product = products[products.length - 1];
        id = last_product.id + 1;
    } 
    else {
        id = 1; // Start ID at 1 if the collection is empty
    }
    
    // Basic validation check
    if (!req.body.name || !req.body.image || !req.body.category || !req.body.new_price || !req.body.old_price) {
        return res.status(400).json({ success: false, message: "Missing required product fields." });
    }

    // Creates a new Mongoose Product object using the generated ID and request body data
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    
    try {
        await product.save(); // Saves the new product document to MongoDB
        console.log("Saved successfully!");
        // Sends a success response back to the client
        res.json({
            success: true,
            name: req.body.name,
        });
    } catch (error) {
        console.error("Error saving product:", error);
        res.status(500).json({ success: false, message: "Failed to save product to database." });
    }
});

// 2. REMOVE PRODUCT ENDPOINT (D: Delete Product)
// Handles deletion of a product based on its custom 'id' field
app.post('/removeproduct', async (req, res) => {
    // findOneAndDelete is used to query by the custom 'id' field, not MongoDB's internal '_id'
    const result = await Product.findOneAndDelete({ id: req.body.id });
    
    if (result) {
        console.log(`Product with id ${req.body.id} removed.`);
        // Sends a success response
        res.json({
            success: true,
            id: req.body.id 
        });
    } else {
        // Sends a 404 response if the product ID was not found
        console.log(`Product with id ${req.body.id} not found.`);
        res.status(404).json({ success: false, message: `Product with ID ${req.body.id} not found.` });
    }
});

// 3. GET ALL PRODUCTS ENDPOINT (R: Read All Products)
// Fetches all product documents from the database
app.get("/allproducts", async (req, res) => {
    try {
        // Fetches all documents and sorts them by the custom 'id' field in ascending order
        let products = await Product.find({}).sort({id: 1}); 
        console.log("All Products Fetched");
        // Sends the array of product objects as JSON to the client
        res.send(products);
    } catch (error) {
        console.error("Error fetching all products:", error);
        res.status(500).send("Error fetching products.");
    }
});


// Schema creating user model

const Users = mongoose.model("Users", {
    name: {
        type: String,
        
    },
    email: {
        type: String,
        unique: true, // Ensures no two users have the same email
      
    },
    password: {
        type: String,
        
    },
    cartData: { // Corrected semicolon (;) to a colon (:)
        type: Object,
    }, 
    date: {
        type: Date,
        default: Date.now,
    },
});

// Creating Endpoint for user registration
app.post("/signup", async (req, res) => {
    // Basic validation check
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, errors: "Email already registered." });
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }
    const user = new Users({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    });

    await user.save();

    const data = {
        user: {
            id: user.id
        },
    };

    const token = jwt.sign(data,'secret_ecom');
    res.json({ success: true,token });
});

// Creating Endpoint for user login
app.post("/login", async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user: {
                    id: user.id,
                },
            };
            const token = jwt.sign  (data,'secret_ecom');
            res.json({ success: true, token });
        } else {
            res.json({ success: false, errors: "Incorrect Password" });
        }
    }
    else {
        res.json({ success: false, errors: "Email not registered" });
    }
});
        
// creating endpoint for new collection data
app.get('/newcollections', async (req, res) => {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("New Collection Fetched");
    res.send(newcollection);
});


// creating endpoint for proper
app.get('/popularinwomen', async (req, res) => {
    let products = await Product.find({category: "women"});
    let popular_in_women = products.slice(0,4);
    console.log("Popular in women Fetched");
    res.send(popular_in_women);
});

//creating middleware for verifying user
const fetchuser = async (req, res, next) => {
    // Get the user from the jwt token and add id to req object
    const token = req.header('auth-token');
    if (!token) {
        res.status(401).send({ errors: "Please authenticate using a valid token" });
    }
    else {
        try {
            const data = jwt.verify(token, 'secret_ecom');
            req.user = data.user;
            next();
        } catch (error) {
            res.status(401).send({ errors: "Please authenticate using a valid token" });
        }
    }
}
// creating endpoint for cart data
app.post('/addtocart', fetchuser,async (req, res) => {
    console.log("Added",req.body.itemId);
    let userData = await Users.findOne({_id: req.user.id});
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
    res.send("Added")
})


//  Creating endpoint to remove item from cart
app.post('/removefromcart', fetchuser, async (req, res) => {
    console.log("Removed",req.body.itemId);
    let userData = await Users.findOne({_id: req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -= 1;
    await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
    res.send("Removed")
})

// creating endpoint to get cart data
app.post('/getcart',fetchuser, async (req, res) => {
    console.log("Cart data fetched");
    let userData = await Users.findOne({_id: req.user.id});
    res.json(userData.cartData);
})


// --- SERVER LISTENER ---

// Starts the Express server and listens on the specified port
app.listen(port, (error) => {
    if (!error) {
        console.log("Server Running on Port " + port)
    }
    else {
        console.log("Error : " + error)
    }
});
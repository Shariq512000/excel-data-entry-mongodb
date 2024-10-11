import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import XLSX from "xlsx";

const PORT = 5000;
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json())
// const mongodbURI = process.env.mongodbURI || "mongodb+srv://adminuser:adminpassword@cluster0.szsed.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const mongodbURI = "mongodb://localhost:27017/test"

mongoose.connect(mongodbURI);

let productSchema = new mongoose.Schema(
    {
        name: {type: String, required: true},
        price: {type: Number, required: true},
        description: String,
        postedAt: {type: Date, default: Date.now}
    }
)

const productModel = mongoose.model('products' , productSchema);

let discrepancySchema = new mongoose.Schema(
    {
        "Employee Name": {type: String},
        "Employee Type": {type: String},
        "Reporting": String,
        "Department": String,
        "Leave Type": String,
        "Reason": String,
        "Status": String
    }
)

const disModel = mongoose.model('discrepancy' , discrepancySchema);

app.post("/add-product" , async(req , res) => {

    let productBody = req.body;

    let newData = {
        name: productBody.name,
        price: productBody.price,
        description: productBody.description
    }
    try {
        const result = await productModel.create(newData);
        res.send({status: "success" , message: "Product Added" , result: result})
    } catch (err) {
        res.status(500).send({status: "error" , message: "Server Error" , error: err})
    }
})

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // Read the uploaded file
    const workbook = XLSX.readFile(req.file.path);
    
    // Assuming you want to read the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert the sheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // console.log(data);
    // Send the data back as a response

    try{
        let result = disModel.insertMany(data);
        res.send({"status" : "success", result: result})
    }catch(err){
        res.status(500).send({status: "error" , message: "Internal Server Error", detail: err})
    }

    // res.send({"status" : "success", result: data})

});

app.post("/check-result" , async(req , res) => {
    let reqBody = req.body;
    if(!reqBody?.name){
        res.status(401).send({status: "bad request", message: "Name is Required"})
        return;
    }
    console.log(reqBody?.name)
    try {
        const item = await disModel.findOne({ "Employee Name": reqBody?.name });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        // res.json(item);
        res.send({"status" : "success", result: item , size: Buffer.byteLength(JSON.stringify(item))})
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

app.get("/" , (req , res) => {
    res.send("Hello World");
})

app.listen(PORT , () => {
    console.log("App is Running")
});

////////////////mongodb connected disconnected events///////////////////////////////////////////////
mongoose.connection.on('connected', function () {//connected
    console.log("Mongoose is connected");
});

mongoose.connection.on('disconnected', function () {//disconnected
    console.log("Mongoose is disconnected");
    process.exit(1);
});

mongoose.connection.on('error', function (err) {//any error
    console.log('Mongoose connection error: ', err);
    process.exit(1);
});

process.on('SIGINT', function () {/////this function will run jst before app is closing
    console.log("app is terminating");
    mongoose.connection.close(function () {
        console.log('Mongoose default connection closed');
        process.exit(0);
    });
});
////////////////mongodb connected disconnected events///////////////////////////////////////////////
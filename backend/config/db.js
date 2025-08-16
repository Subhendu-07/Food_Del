import mongoose from "mongoose";


export const connectDB = async () => {
    await mongoose.connect(
      "mongodb+srv://Subhendu:Subhendu243@cluster0.jsabokt.mongodb.net/food_delivery_webpage"
    );
    console.log("DB Connected");
};

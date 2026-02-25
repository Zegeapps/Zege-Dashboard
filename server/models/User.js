const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        avatar: {
            type: String,
            default: "Sree", // filename in /public (Sree or Vimy)
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

import mongoose, { Schema } from "mongoose";

const hospitalSchema = new Schema(
  {
    hospitalDetails: {
      name: String,
      address: String,
      phone: Number,
      email: String,
      isRegistered: Boolean,
      req: true,
    },

    doctorsDetails: {
      name: Schema.Types.ObjectId,
      ref: "Doctor",
    },

    managementEmployesDetails: {
      name: Schema.Types.ObjectId,
      ref: "Employe",
    },
  },
  { timestamps: true }
);

export const Hospital = mongoose.model("Hospital", hospitalSchema);

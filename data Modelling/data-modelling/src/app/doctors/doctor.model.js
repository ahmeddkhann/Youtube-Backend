import mongoose, { Schema } from "mongoose";

const doctorSchema = new Schema(
  {
    personalDetails: {
      name: String,
      email: String,
      phone: Number,
      address: String,
      DOB: String,
      req: true,
    },

    educationalDetails: {
      degree: String,
      specialization: String,
      university: String,
      year: Number,
      CGPA: Number,
      req: true,
    },

    experienceDetails: {
      housejobAt: String,
      WorkingAt: String,
      previouslyWorkedAt: String,
      experienceInYears: Number,
      req: true,
    },
  },
  { timestamps: true }
);

export const Doctor = mongoose.model("Doctor", doctorSchema);

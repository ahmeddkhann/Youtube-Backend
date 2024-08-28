import mongoose, { Schema } from "mongoose";

const patientSchema = new Schema(
  {
    personalDetails: {
      name: String,
      phone: Number,
      email: String,
      age: Number,
      Address: String,
      req: true,
    },

    medicalRecord: {
      previousDiseases: {
        name: String,
        duration: String,
        treatmentAt: String,
        treatmentBy: String,
        atAge: Number,
      },
    },

    diseaseDetails: {
      diseaseName: String,
      hadBefore: Boolean,
      diseaseDuration: String,
      diseaseType: String,
    },

    consultantDoctor: {
      name: Schema.Types.ObjectId,
      ref: "Doctor",
    },

    prescribeMedicines: {
      name: String,
      quantity: Number,
      takingDurationInDay: Number,
    },
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);

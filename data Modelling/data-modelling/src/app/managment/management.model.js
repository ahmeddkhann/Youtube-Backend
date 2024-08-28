import mongoose, { Schema } from "mongoose";

const managementDetails = new Schema(
  {
    personalDetails: {
      name: String,
      email: String,
      phone: Number,
      address: String,
      req: true,
    },

    jobDetails: {
      jobTitle: String,
      atPreviousPosition: String,
      currentPosition: String,
    },

    qualifications: {
      institiute: String,
      degree: String,
      experience: Number,
    },

    moreInformation: {
      arrivalAtOffice: String,
      departureFromOffice: String,
      salary: Number,

      leaves: {
        ifTookLeaveToday: Boolean,
        leavesReason: String,
        annualLeaves: Number,
        casualLeaves: Number,
        monthlyLeaves: Number,
      },
    },
  },
  { timestamps: true }
);

export const Management = mongoose.model("Management", managementDetails);

import { model, Schema } from "mongoose";

const courseSchema = new Schema({
  title: {
    type: String,
    required:[true,'Title is required'],
    minLength:[8,'Title must be at least 8 characters '],
    maxLength:[60,'Title must be less than 60 characters'],
    trim:true
  },
  description: {
    type: String,
    required:[true,'Description is required'],
    minLength:[8,'Description must be at least 8 characters '],
    maxLength:[260,'Description must be less than 260 characters'],
    trim:true
  },
  category: {
    type: String,
    required:[true,'category is required'],

  },
  thumbnail: {
    public_Id: {
        type: String,
        required:true
    },
    secure_Url: {
      type: String,
      required:true

    },
  },
  lectures: [{
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    lecture: {
      public_Id: {
        type: String,
      },
      secure_Url: {
        type: String,
      },
    },
    thumbnail: {
      public_Id: {
        type: String,
      },
      secure_Url: {
        type: String,
      },
    },
  }],
  numberOfLecture: {
    type: String,
    default:0
  },
  createdBy: {
    type: String,
    required:true

  },
},{
    timestamps:true
});

const coursemodel = model("Courses", courseSchema);
export default coursemodel;

import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commenttSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: 'Video',
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {timestamps: true}
)

commenttSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commenttSchema) 
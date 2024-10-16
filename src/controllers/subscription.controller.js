import mongoose,{isValidObjectId} from "mongoose";
import {User} from "../models/user.model.js"
import {Subscription} from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async(req,res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id")
    }

    try {
        const subscribed = await Subscription.findOne({
          subscriber: req.user?._id,
          channel: channelId,
        });
    
        if (!subscribed) {
          const result = await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId,
          });
          return res.status(200).json(new ApiResponse(200, result, "channel Subscribed"));
        } else {
          const result = await Subscription.deleteOne({
            subscriber: req.user?._id,
            channel: channelId,
          });
          if (!result.deletedCount) {
            throw new ApiError(500, "Something went wrong while toggling subscription");
          }
          return res.status(200).json(new ApiResponse(200, result, "channel Unsubscribed"));
        }
      } catch (error) {
        throw new ApiError(500, error);
      }
})

// controller to return subscription
const getUserChannelSubscribers = asyncHandler(async(req,res)=> {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id")
    }
    console.log(req?.user?._id)
    // const subscribers = await User.aggregate([
    //   {
    //     $match: {
    //       _id: new mongoose.Types.ObjectId(channelId)
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: 'subscriptions',
    //       localField: '_id',
    //       foreignField: 'channel',
    //       as: "subscribers"
    //     }
    //   },
    //   {
    //     $addFields: {
    //       subscriber: {
    //         $size:'$subscribers'
    //       }
    //     }
    //   },
    //   {
    //     $project: {
    //       subscriber: 1,
    //       fullName: 1,
    //       avatar: 1,
    //       coverImage: 1,
    //       username: 1,
    //       isSubscribed: {
    //         $eq:['$subscribers.subscriber', req.user?._id]
    //       }
    //     }
    //   }
    // ])

    const subscribers = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(channelId)
        }
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'channel',
          as: "subscriptions"
        }
      },
      {
        $addFields: {
          subscriber: {
            $size: '$subscriptions'
          }
        }
      },
      {
        $project: {
          subscriber: 1,
          fullName: 1,
          avatar: 1,
          coverImage: 1,
          username: 1,
          isSubscribed: {
            $anyElementTrue: {
              $map: {
                input: '$subscriptions',
                as: 'subscription',
                in: {
                  $eq: ['$$subscription.subscriber', req?.user?._id]
                }
              }
            }
          }
        }
      }
    ]);
    
    // Debugging steps:
    console.log('req.user?._id:', req?.user?._id);
    console.log('subscribers:', subscribers);
    console.log('subscribers[0].subscriber:', subscribers[0]?.subscriber);

    if(!subscribers) {
        throw new ApiError(500, "something went wrong while fatching subscriber")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "all subscriber of this channel fatched successfully"))

})

// controller to return channel
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    // console.log(channelId)
    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid subscriber Id")
    }

    const subscribedTo = await Subscription.find({
        subscriber: channelId
    })

    if(!subscribedTo) {
        throw new ApiError(500, "something went wrong while fatching subscribed channel")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, subscribedTo, "all subscribed channel of this user fatched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
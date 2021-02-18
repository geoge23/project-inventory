const mongoose = require('mongoose')
const { MongoError } = require('mongodb')
const { Schema, Error: mongooseError } = require('mongoose');

module.exports = {
    Item: mongoose.model('items', {
        id: { type: Number, unique: true, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        checkoutHistory: [{
            userID: { type: Schema.Types.ObjectId, ref: 'users' },
            time: { type: Date, default: Date.now() },
            checking: {type: String, enum: ['in', 'out']},
            quantity: Number
        }],
        meta: Object,
        area: { type: Schema.Types.ObjectId, ref: 'areas' },
        tags: [{ type: Schema.Types.ObjectId, ref: 'tags' }],
        dateAdded: { type: Date, default: Date.now() }
    }),
    Area: mongoose.model('areas', {
        name: String,
        id: { type: Number, unique: true },
        level: Number,
        children: [{ type: Schema.Types.ObjectId, ref: 'tags' }],
    }),
    Tag: mongoose.model('tags', {
        name: { type: String, unique: true, required: true }
    }),
    User: mongoose.model('users', {
        name: String,
        id: Number
    }),
    Error(res, {message = 'An internal error has occured', code = 500, error = {}}) {
        if (error instanceof mongooseError.ValidationError) {
            code = 400;
            message = error.toString()
        } else if (error instanceof MongoError && error.code == 11000) {
            code = 409;
            message = 'This element already exists';
        } else if (error.toString() == "Error: Tag not found") {
            code = 400;
            message = error.toString()
        }
        res.status(code).send({
            status: 'error',
            message,
            code
        })
    },
    Success(res, {message, code = 200, body = {}}) {
        res.status(code).send({
            status: 'success',
            message,
            code,
            ...body
        })
    }
}
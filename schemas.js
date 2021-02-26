const mongoose = require('mongoose')
const { MongoError } = require('mongodb')
const { Schema, Error: mongooseError } = require('mongoose');

module.exports = {
    Item: mongoose.model('items', {
        id: { type: Number, unique: true, required: true },
        name: { type: String, required: true, text: true },
        quantity: { type: Number, default: 1 },
        available: { type: Number, default: 1 },
        checkoutHistory: [{
            userID: { type: Schema.Types.ObjectId, ref: 'users' },
            time: { type: Date, default: Date.now() },
            checking: {type: String, enum: ['in', 'out']},
            quantity: Number
        }],
        meta: Object,
        area: { type: Schema.Types.ObjectId, ref: 'areas', required: true },
        tags: [{ type: Schema.Types.ObjectId, ref: 'tags' }],
        dateAdded: { type: Date, default: Date.now() }
    }),
    Area: mongoose.model('areas', {
        name: String,
        id: { type: Number, unique: true },
        children: [{ type: Schema.Types.ObjectId, ref: 'tags' }],
        parent: { type: Schema.Types.ObjectId, ref: 'tags' },
        meta: Object
    }),
    Tag: mongoose.model('tags', {
        name: { type: String, unique: true, required: true }
    }),
    // User: mongoose.model('users', {
    //     name: String,
    //     id: Number
    // }),
    Error(res, {message = 'An internal error has occured', code = 500, error = {}}) {
        if (error instanceof mongooseError.ValidationError) {
            code = 400;
            message = error.toString()
        } else if (error instanceof MongoError && error.code == 11000) {
            code = 409;
            message = 'This element already exists';
        } else if (error.toString().indexOf('Couldn\'t find tag') != -1) {
            code = 400;
            message = error.toString()
        } else if (error.toString().indexOf(`Cannot read property '_id' of null`) != -1) {
            code = 400;
            message = 'Cannot find object with that ID'
        } else if (error.toString().indexOf('Checkin mismatch with current state') != -1) {
            code = 409;
            message = error.toString()
        } else {
            console.log(error.toString(), error.stack)
        }
        res.status(code).send({
            status: 'error',
            message,
            code
        })
    },
    Success(res, {message = '', code = 200, body = {}}) {
        res.status(code).send({
            status: 'success',
            message,
            code,
            ...body
        })
    }
}
const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()
const {Item, Area, Tag, User, Error, Success} = require('./schemas')
const { parseTags } = require('./functions')

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const app = express()
app.use(require('body-parser').json())

app.put('/item', async (req, res) => {
    try {
        const { id, name, quantity = 1, meta = {}, tags = [] } = req.body;
        const parsedTags = await parseTags(tags)
        const item = new Item({
            id,
            name,
            quantity,
            tags: parsedTags,
            meta
        })
        const newDoc = await item.save()
        Success(res, {
            code: 201,
            changes: newDoc
        })
    } catch (e) {
        Error(res, {
            error: e,
            message: e.toString()
        })
    }
})

app.get('/item', async (req, res) => {
    try {
        const queryDoc = {};
        if (req.body.id) {
            queryDoc.id = req.body.id
        }
        if (req.body.tags) {
            queryDoc.tags = {
                $all: await parseTags(req.body.tags)
            }
        }
        if (req.body.name) {
            queryDoc.name = req.body.name
        }
        const items = await Item.find(queryDoc)
        Success(res, {
            body: {
                response: items
            }
        })
    } catch (e) {
        Error(res, {
            error: e
        })
    }
})

app.put('/tag', async (req, res) => {
    try {
        const { name } = req.body;
        const tag = new Tag({name})
        const {_id: id} = await tag.save();
        Success(res, {
            code: 201,
            body: {
                created: id
            },
            message: 'Tag was created'
        })
    } catch (e) {
        Error(res, {
            error: e
        })
    }
})

app.get('/tags', async (req, res) => {
    try {
        let queryDoc = {}
        if (req.body.name) {
            queryDoc.name = req.body.name
        }
        if (req.body.id) {
            queryDoc._id = mongoose.Types.ObjectId(req.body.id)
        }
        const tags = await Tag.find(queryDoc)
        Success(res, {
            code: 200,
            body: {
                response: tags
            }
        })
    } catch (e) {
        Error(res, {
            error: e
        })
    }
})

app.listen(process.env.PORT || 8080)
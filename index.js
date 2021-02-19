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
        let { id, name, quantity = 1, meta = {}, tags = [], area } = req.body;
        const parsedTags = await parseTags(tags)
        if (Number.isInteger(area)) {
            area = (await Area.findOne({id: area}))._id;
        }
        const item = new Item({
            id,
            name,
            quantity,
            tags: parsedTags,
            meta,
            area
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
        if (req.body.area) {
            let area = req.body.area
            if (Number.isInteger(area)) {
                area = (await Area.findOne({id: area}))._id;
            }
            queryDoc.area = mongoose.Types.ObjectId(area)
        }
        if (req.body.name) {
            queryDoc.$text = {
                $search: req.body.name
            }
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

app.get('/tag', async (req, res) => {
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

app.put('/area', async (req, res) => {
    try {
        const { name, id, parent } = req.body;
        const newDoc = new Area({
            name,
            id
        });
        let parentDoc;
        if (parent) {
            let parentQuery = {}
            if (Number.isInteger(parent)) {
                parentQuery.id = parent;
            } else {
                parentQuery._id = parent;
            }
            parentDoc = await Area.findOne(parentQuery)
            newDoc.parent = mongoose.Types.ObjectId(parentDoc._id)
        }
        await newDoc.save()
        if (parentDoc) {
            await Area.updateOne(parentDoc, {
                $addToSet: {
                    children: mongoose.Types.ObjectId(newDoc._id)
                }
            })
        }
        Success(res, {
            body: {
                created: newDoc
            }
        })
    } catch (error) {
        Error(res, {
            error
        })
    }
})

app.listen(process.env.PORT || 8080)
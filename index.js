const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()
const {Item, Area, Tag, User, Error, Success} = require('./schemas')
const { parseTags, parseID } = require('./functions')

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
        await item.save()
        Success(res, {
            code: 201,
            body: {
                changes: item
            }
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
        if (req.body.orphaned) {
            queryDoc.area = null;
        }
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

app.delete('/tag', async (req, res) => {
    try {
        let queryDoc = {}
        if (req.body.name) {
            queryDoc.name = req.body.name
        }
        if (req.body.id) {
            queryDoc._id = mongoose.Types.ObjectId(req.body.id)
        }
        const tag = await Tag.findOne(queryDoc)
        const id = tag._id
        const itemQueryDoc = {
            tags: {
                $all: [id]
            }
        }
        await Item.updateMany(itemQueryDoc, {
            $pull: {
                tags: id
            }
        })
        await Tag.deleteOne(tag)
        Success(res, {
            message: `Tag ${id} deleted`
        })
    } catch (error) {
        Error(res, {error})
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

app.delete('/area', async (req, res) => {
    try {
        const { id } = req.body;
        const queryDoc = {}
        if (Number.isInteger(id)) {
            queryDoc.id = id
        } else {
            queryDoc._id = mongoose.Types.ObjectId(id)
        }
        const recursiveDelete = async (docQuery) => {
            const doc = await Area.findOne(docQuery)
            if (!doc) {
                Error(res, {
                    message: 'Area doesn\'t exist',
                    code: 400
                })
                return;
            }
            Item.updateMany({
                area: mongoose.Types.ObjectId(doc._id)
            }, {
                $set: {
                    area: null
                }
            })
            if (doc && doc.children.length > 0) {
                doc.children.forEach(async e => {
                    recursiveDelete({
                        _id: mongoose.Types.ObjectId(e)
                    })
                })
            }
            await Area.deleteOne(doc)
        }
        await recursiveDelete(queryDoc)
        Success(res, {
            message: `Deleted doc(s)`
        })
    } catch (error) {
        Error(res, {
            error
        })
    }
})

app.get('/area', async (req, res) => {
    try {
        const queryDoc = {}
        if (req.body.topLevel) {
            queryDoc.parent = {
                $exists: false
            }
        }
        if (req.body.bottomLevel) {
            queryDoc.children = {
                $size: 0
            }
        }
        if (req.body.id) {
            parseID(req.body.id, queryDoc)
        }
        if (req.body.parent && !req.body.topLevel) {
            if (Number.isInteger(req.body.parent)) {
                queryDoc.parent = (await Area.findOne({id: req.body.parent}))._id
            } else {
                queryDoc.parent = mongoose.Types.ObjectId(req.body.parent)
            }
        }
        const response = await Area.find(queryDoc)
        Success(res, {
            body: {
                response
            }
        })
    } catch (error) {
        Error(res, {
            error
        })
    }
})

app.listen(process.env.PORT || 8080)
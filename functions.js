const { Tag } = require('./schemas')
const { Types } = require('mongoose')

module.exports = {
    async parseTags(tags) {
        let newTags = []
        for (const tag of tags) {
            if (Types.ObjectId.isValid(tag)) {
                newTags.push(tag)
            } else {
                const tagDoc = await Tag.findOne({name: tag});
                if (tagDoc != null) {
                    newTags.push(tagDoc._id)
                } else {
                    throw new Error('Couldn\'t find tag ' + tag)
                }
            }
        }
        return newTags;
    },
    parseID(id, queryDoc) {
        if (Number.isInteger(id)) {
            queryDoc.id = id
        } else {
            queryDoc._id = Types.ObjectId(id)
        }
    }
}
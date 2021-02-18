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
                    throw new Error('Tag not found')
                }
            }
        }
        return newTags;
    }
}
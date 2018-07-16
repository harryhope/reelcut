const _ = require('lodash')
const fluentFfmpeg = require('fluent-ffmpeg')

const applyScale = (options, metadata, filtersList) => {
  const height = metadata.streams.reduce((height, stream) => stream.height || height, null)
  if (Number(options.height) > height) {
    filtersList.unshift(`scale=-1:${options.height}`)
  }
  return filtersList
}

const probe = (ffmpeg, video) => new Promise((resolve, reject) => {
  ffmpeg.ffprobe(video, (err, metadata) => {
    if (err) {
      return reject(err)
    }
    return resolve(metadata)
  })
})

const createCut = (ffmpeg, video, metadata, options) => new Promise((resolve, reject) => {
  ffmpeg(video)
    .seek(options.seek)
    .duration(options.length)
    .noAudio()
    .videoFilters(applyScale(options, metadata, [`crop=${options.width}:${options.height}`]))
    .save(`${options.outputPath}${options.filename}`)
    .on('end', () => resolve(`${options.outputPath}${options.filename}`))
    .on('error', (err) => reject(err))
})

const merge = (command, path) => new Promise((resolve, reject) => {
  command
    .on('end', () => resolve(path))
    .on('error', (err) => reject(err))
    .mergeToFile(path)
})

module.exports = (ffmpeg = fluentFfmpeg) => ({
  cut: async (video, userOptions = {}) => {
    const options = _.defaults(userOptions, {
      amount: 4,
      length: 1.5,
      width: 660,
      height: 660,
      prefix: 'vid',
      outputPath: './'
    })
    const metadata = await probe(ffmpeg, video)
    const {duration} = metadata.format
    const cuts = _.range(options.amount).map((index) => {
      const lowerBound = duration / options.amount * index
      const upperBound = _.min([_.floor(duration - options.length), duration / options.amount * (index + 1)])
      const randomSeekTime = _.round(_.random(lowerBound, upperBound), 1)
      return createCut(ffmpeg, video, metadata, Object.assign({}, options, {
        seek: randomSeekTime,
        filename: `${options.prefix}-${index}.mp4`
      }))
    })
    return Promise.all(cuts)
  },

  paste: async (clips, path) => {
    const command = ffmpeg()
    clips.forEach((clip) => command.addInput(clip))
    return merge(command, path)
  }
})

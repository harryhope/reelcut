const _ = require('lodash')
const fluentFfmpeg = require('fluent-ffmpeg')

const probe = (ffmpeg, video) => new Promise((resolve, reject) => {
  ffmpeg.ffprobe(video, (err, metadata) => {
    if (err) {
      return reject(err)
    }
    return resolve(metadata)
  })
})

const createCut = (ffmpeg, video, options) => new Promise((resolve, reject) => {
  ffmpeg(video)
    .size(`${options.width}x${options.height}`)
    .seek(options.seek)
    .duration(options.length)
    .noAudio()
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
  cut: async (video, options = {}) => {
    options = _.defaults(options, {
      amount: 4,
      length: 1.5,
      width: 660,
      height: 660,
      outputPath: './'
    })
    const metadata = await probe(ffmpeg, video)
    const {duration} = metadata.format
    const cuts = _.range(options.amount).map((index) => {
      const lowerBound = duration/options.amount * index
      const upperBound = _.min([_.floor(duration - options.length), duration/options.amount * (index + 1)])
      const randomSeekTime = _.round(_.random(lowerBound, upperBound), 1)
      return createCut(ffmpeg, video, Object.assign({}, options, {
        seek: randomSeekTime,
        filename: `vid-${index}.mp4`
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

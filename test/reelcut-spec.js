const {expect} = require('chai')
const reelcut = require('../index')

describe('reelcut', () => {
  it('should cut a video into hilights', (done) => {
    reelcut()
    expect(1).to.equal(1)
    done()
  })
})

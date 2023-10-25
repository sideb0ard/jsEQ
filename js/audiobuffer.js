export default class AudioBuffer {
  constructor(blobsize, readChunkSize, dataType = 'Float32') {
    this.dataStore = new Float32Array(blobsize);
    this.bottom = 0;
    this.readChunkSize = readChunkSize;
    this.blobsize = blobsize
  }

  enqueue(chunk) {
    console.log("WNCHUNk!");
    if (this.bottom + chunk.length > this.blobsize) {
      console.log('blob overflow! bottom, chunklength, blobsize ' + this.bottom + ', ' + chunk.length + ', ' + this.dataStore.length)
    } else {
      this.dataStore.set(chunk, this.bottom) //copy the array to the bottom
      this.bottom += chunk.length
    }
  }

  dequeue() {
    // retrieves a chunk of data of size this.readChunkSize and adjusts the bottom
    // If insufficient data returns false
    let retval = null
    if (this.bottom >= this.readChunkSize) {
      retval = this.dataStore.slice(0, this.readChunkSize)
      this.dataStore.copyWithin(0, this.readChunkSize, this.bottom)
      this.bottom -= this.readChunkSize
    }
    return retval
  }

  isEmpty() {
    return (this.bottom < this.readChunkSize)
  }
}

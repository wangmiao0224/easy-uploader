import SparkMD5 from "spark-md5"

self.onmessage = function (data) { 
    const [fileData,chunk] = data.data
    const spark = new SparkMD5.ArrayBuffer()
    chunk.arrayBuffer().then((ab) => { 
        spark.append(ab)
        if (typeof fileData == 'object') { 
            fileData.hash = spark.end()
        }
        postMessage(fileData)
    })
}


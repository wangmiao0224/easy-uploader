import SparkMD5 from "spark-md5"

self.onmessage = function (data) { 
    const chunk = data.data[0]
    const spark = new SparkMD5.ArrayBuffer()
    chunk.arrayBuffer().then((ab) => { 
        spark.append(ab)
        postMessage(spark.end())
    })
}


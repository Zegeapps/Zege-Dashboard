export default function handler(req, res) {
    res.status(200).json({
        message: 'Environment Test',
        hasMongoUri: !!process.env.MONGO_URI,
        nodeEnv: process.env.NODE_ENV,
        urlLength: process.env.MONGO_URI ? process.env.MONGO_URI.length : 0
    });
}

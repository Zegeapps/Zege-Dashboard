export default function handler(req, res) {
    console.log('--- TEST API CALLED ---');
    res.status(200).json({ message: 'API is working', time: new Date().toISOString() });
}

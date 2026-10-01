// Vercel Serverless Function: Order & Quote Inquiry Handler
export default function handler(req, res) {
    // Handle CORS preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const orderData = req.body || {};
        const generatedOrderId = 'ABI-GH-' + Math.floor(100000 + Math.random() * 900000);

        // Log inquiry details on Vercel logs for Abigail Amoah
        console.log(`[ABI BAKERY INQUIRY] ID: ${generatedOrderId}`);
        console.log(`Customer: ${orderData.customer_name} (${orderData.customer_phone})`);
        console.log(`Items:`, orderData.items);

        return res.status(200).json({
            success: true,
            order_id: generatedOrderId,
            message: 'Inquiry successfully submitted to Abigail Amoah at Abi\'s Bakery!',
            timestamp: new Date().toISOString()
        });
    }

    return res.status(200).json({
        status: 'Abi\'s Bakery API is operational',
        phone: '0549946550',
        location: 'Accra, Ghana'
    });
}

<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Database configuration
$host = 'localhost';
$dbname = 'abis_bakery';
$username = 'root';
$password = '';

$pdo = null;
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Auto-create orders / inquiries table if not exists (No price fields required)
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_reference VARCHAR(50) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        delivery_address TEXT,
        special_instructions TEXT,
        inquiry_status VARCHAR(50) DEFAULT 'pending_quote',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Auto-create order_items table if not exists (No price fields)
    $pdo->exec("CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        item_category VARCHAR(100),
        quantity INT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

} catch(PDOException $e) {
    // Database is optional or not running locally; fallback to resilient file-based inquiry storage
    $pdo = null;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit();
    }

    // Validate required fields (No price or total_amount required)
    $required_fields = ['customer_name', 'customer_phone', 'items'];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit();
        }
    }
    
    // Validate email format if provided
    if (!empty($data['customer_email']) && !filter_var($data['customer_email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit();
    }
    
    // Validate items array
    if (!is_array($data['items']) || empty($data['items'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No items in order inquiry']);
        exit();
    }

    $order_id = 'AB-GH-' . rand(100000, 999999);

    if ($pdo !== null) {
        try {
            $pdo->beginTransaction();
            
            $order_sql = "INSERT INTO orders (order_reference, customer_name, customer_email, customer_phone, 
                          delivery_address, special_instructions, inquiry_status, created_at) 
                          VALUES (?, ?, ?, ?, ?, ?, 'pending_quote', NOW())";
            
            $order_stmt = $pdo->prepare($order_sql);
            $order_stmt->execute([
                $order_id,
                $data['customer_name'],
                $data['customer_email'] ?? '',
                $data['customer_phone'],
                $data['delivery_address'] ?? '',
                $data['special_instructions'] ?? ''
            ]);
            
            $db_order_id = $pdo->lastInsertId();
            
            $item_sql = "INSERT INTO order_items (order_id, item_name, item_category, quantity) 
                         VALUES (?, ?, ?, ?)";
            $item_stmt = $pdo->prepare($item_sql);
            
            foreach ($data['items'] as $item) {
                $qty = max(1, intval($item['quantity'] ?? 1));
                $item_stmt->execute([
                    $db_order_id,
                    $item['name'],
                    $item['category'] ?? 'Ghanaian Pastry',
                    $qty
                ]);
            }
            
            $pdo->commit();
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            // Fallback to file logging if DB write fails
            logOrderToFile($data, $order_id);
        }
    } else {
        // Fallback file storage
        logOrderToFile($data, $order_id);
    }
    
    // Attempt confirmation email if customer email provided
    $email_sent = false;
    if (!empty($data['customer_email'])) {
        $email_sent = sendOrderConfirmationEmail($data, $order_id);
    }
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'order_id' => $order_id,
        'message' => 'Your inquiry was sent to Abigail Amoah! She will contact you directly with pricing and delivery details.',
        'email_sent' => $email_sent
    ]);
    exit();
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['order_id']) && $pdo !== null) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_reference = ? OR id = ?");
            $clean_id = preg_replace('/[^0-9A-Za-z\-]/', '', $_GET['order_id']);
            $stmt->execute([$clean_id, $clean_id]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($order) {
                $items_stmt = $pdo->prepare("SELECT item_name, item_category, quantity FROM order_items WHERE order_id = ?");
                $items_stmt->execute([$order['id']]);
                $order['items'] = $items_stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($order);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Inquiry not found']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to retrieve inquiry']);
        }
    } else {
        http_response_code(200);
        echo json_encode(['status' => 'Abi\'s Bakery Ghanaian Pastries Inquiry API is operational']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

function logOrderToFile($data, $orderId) {
    $orderRecord = [
        'order_reference' => $orderId,
        'timestamp' => date('c'),
        'inquiry' => $data
    ];
    $logLine = json_encode($orderRecord, JSON_PRETTY_PRINT) . PHP_EOL . '---' . PHP_EOL;
    @file_put_contents(__DIR__ . '/orders_log.txt', $logLine, FILE_APPEND | LOCK_EX);
}

function sendOrderConfirmationEmail($orderData, $orderId) {
    $to = $orderData['customer_email'];
    $subject = "Inquiry Received — Abi's Bakery (#$orderId)";
    
    $message = "
    <html>
    <head><title>Pastry Inquiry Confirmation</title></head>
    <body style='font-family: Arial, sans-serif; color: #2A1E17; line-height: 1.6;'>
        <h2>Thank you for contacting Abi's Bakery!</h2>
        <p>Dear " . htmlspecialchars($orderData['customer_name']) . ",</p>
        <p>We've received your inquiry for our handcrafted locally made Ghanaian pastries.</p>
        
        <h3>Inquiry Reference #" . htmlspecialchars($orderId) . "</h3>
        <p><strong>Pricing:</strong> Custom quote will be provided directly by the owner (Abigail Amoah) based on your requested batch size.</p>
        
        <h4>Requested Items:</h4>
        <ul>";
    
    foreach ($orderData['items'] as $item) {
        $message .= "<li>" . htmlspecialchars($item['name']) . " — Qty / Batch: " . intval($item['quantity']) . "</li>";
    }
    
    $message .= "
        </ul>
        <p>Abigail will reach out directly via WhatsApp or phone to confirm your pricing, ingredients, and delivery or pickup time.</p>
        <p>Warm regards,<br><strong>Abigail Amoah &amp; The Abi's Bakery Family</strong><br>Accra, Ghana</p>
    </body>
    </html>";
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Abi's Bakery <hello@abisbakery.com>\r\n";
    
    return @mail($to, $subject, $message, $headers);
}
?>
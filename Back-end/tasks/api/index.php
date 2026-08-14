<?php

header('Content-Type: application/json');

echo json_encode([
    'status' => 'ok',
    'message' => 'PHP runtime is working',
]);
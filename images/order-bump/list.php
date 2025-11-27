<?php
// Simple PHP script to list images in the folder
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$images = [];
$extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

foreach (glob('*.{' . implode(',', $extensions) . '}', GLOB_BRACE) as $file) {
    $images[] = $file;
}

echo json_encode(['images' => $images]);
?>
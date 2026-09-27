<?php

// Runs one SQL statement against the browser tests' SQLite database and
// prints the rows as JSON: php db.php <database file> "<sql>"
$pdo = new PDO('sqlite:'.$argv[1]);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$statement = $pdo->query($argv[2]);
echo json_encode($statement->fetchAll(PDO::FETCH_ASSOC));

<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $email_to = 'contact@example.com'; // Replace with your email address
  $email_subject = $_POST['subject'];
  $name = $_POST['name'];
  $email_from = $_POST['email'];
  $message = $_POST['message'];

  // Prepare email headers
  $headers = "From: $name <$email_from>" . "\r\n";
  $headers .= "Reply-To: $email_from" . "\r\n";
  $headers .= "Content-type: text/html" . "\r\n";

  // Send email using Formspree endpoint
  $fields = array(
    'name' => $name,
    '_replyto' => $email_from,
    'message' => $message
  );
  $fields_string = http_build_query($fields);
  $ch = curl_init('https://formspree.io/f/mwkjzbya'); // Replace with your Formspree endpoint
  curl_setopt($ch, CURLOPT_POST, 1);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $fields_string);
  curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/x-www-form-urlencoded'));
  $result = curl_exec($ch);
  curl_close($ch);

  // Check if email was sent successfully
  if ($result == "OK") {
    echo "Thanks for your message! We'll be in touch soon.";
  } else {
    echo "Sorry, there was an error sending your message. Please try again later.";
  }
}
?>

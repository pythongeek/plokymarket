    def verify_face_match(self, id_doc_path: str, selfie_path: str) -> tuple:
        """Verify if faces match using facial encodings (dlib)"""
        try:
            import face_recognition

            # Load images
            try:
                id_image = face_recognition.load_image_file(id_doc_path)
                selfie_image = face_recognition.load_image_file(selfie_path)
            except Exception as e:
                return False, 0.0, {
                    "error_type": "upload_error",
                    "message": "Failed to load images",
                    "details": str(e)
                }
            
            # Detect faces and get encodings
            # This uses HOG model by default which is faster but less accurate than CNN
            # For CPU, HOG is fine.
            id_encodings = face_recognition.face_encodings(id_image)
            selfie_encodings = face_recognition.face_encodings(selfie_image)
            
            # Check if faces detected
            if len(id_encodings) == 0:
                return False, 0.0, {
                    "error_type": "face_verification_error",
                    "message": "No face detected in ID document",
                    "details": "Please ensure the ID document has a clear, visible face."
                }
            
            if len(selfie_encodings) == 0:
                return False, 0.0, {
                    "error_type": "face_verification_error",
                    "message": "No face detected in selfie",
                    "details": "Please ensure your selfie has a clear, visible face."
                }
            
            # Identify the largest face if multiple (heuristic: first returned is usually prominent, 
            # but we can assume the user provides a clear single face)
            id_encoding = id_encodings[0]
            selfie_encoding = selfie_encodings[0]
            
            # Compare faces
            # lower distance = better match. Threshold usually 0.6
            distance = face_recognition.face_distance([id_encoding], selfie_encoding)[0]
            
            # Convert distance to confidence score (0 to 100)
            # Distance 0.0 -> Score 100
            # Distance 0.6 -> Score 40 (approx threshold)
            # Distance > 1.0 -> Score 0
            safe_distance = min(max(distance, 0.0), 1.0)
            confidence_score = (1.0 - safe_distance) * 100
            
            # Strict tolerance for KYC
            is_match = distance < 0.5  # Stricter than default 0.6

            if is_match:
                return True, float(confidence_score), {
                    "message": "Face verification successful",
                    "distance": float(distance)
                }
            else:
                return False, float(confidence_score), {
                    "error_type": "face_mismatch",
                    "message": "Face verification failed",
                    "details": "The faces do not match with sufficient confidence.",
                    "distance": float(distance)
                }
                
        except Exception as e:
            print(f"Error in face verification: {e}")
            return False, 0.0, {
                "error_type": "system_error",
                "message": "Error during face verification",
                "details": str(e)
            }


    @staticmethod
    def verify_document_authenticity(document_path: str) -> Tuple[bool, Dict]:
        try:
            # Validate file path
            if not os.path.exists(document_path):
                raise FileNotFoundError("Document file not found")

            # Load the image
            image = cv2.imread(document_path)
            if image is None:
                raise ValueError("Could not load document image")
            
            # Enhanced document checks with detailed feedback
            checks = {
                "resolution_check": {
                    "passed": image.shape[0] >= 1000 and image.shape[1] >= 1000,
                    "message": "Image resolution must be at least 1000x1000 pixels"
                },
                "color_check": {
                    "passed": len(image.shape) == 3,
                    "message": "Image must be in color format"
                },
                "size_check": {
                    "passed": os.path.getsize(document_path) < 10 * 1024 * 1024,
                    "message": "File size must be less than 10MB"
                }
            }
            
            # Collect failed checks
            failed_checks = []
            for check_name, check_data in checks.items():
                if not check_data["passed"]:
                    failed_checks.append(f"{check_name}: {check_data['message']}")
            
            # Overall verification result
            is_valid = all(check["passed"] for check in checks.values())
            
            if not is_valid:
                raise ValueError(f"Document verification failed: {'; '.join(failed_checks)}")
            
            return is_valid, {"checks": {k: v["passed"] for k, v in checks.items()}}
        except Exception as e:
            raise Exception(f"Document verification error: {str(e)}")


    @staticmethod
    def extract_document_data(document_path: str) -> Dict:
        try:
            # Validate file path
            if not os.path.exists(document_path):
                raise FileNotFoundError("Document file not found")

            # Open the image
            image = Image.open(document_path)
            
            # Extract text using OCR
            text = pytesseract.image_to_string(image)
            if not text.strip():
                raise ValueError("No text could be extracted from the document")
            
            # Process the extracted text
            lines = text.split('\n')
            data = {
                "raw_text": text,
                "extracted_lines": [line for line in lines if line.strip()]
            }
            
            return data
        except Exception as e:
            raise Exception(f"Document data extraction error: {str(e)}")
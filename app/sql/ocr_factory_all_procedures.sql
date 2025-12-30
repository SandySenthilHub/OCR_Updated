USE universal;
GO
/* =========================================================
   1️⃣ CASE SEQUENCE (CASE ID GENERATION)
   ========================================================= */
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OF_case_sequence' AND xtype='U')
BEGIN
    CREATE TABLE OF_case_sequence (
        product VARCHAR(50),
        seq_date CHAR(8),
        last_seq INT,
        CONSTRAINT PK_OF_case_sequence PRIMARY KEY (product, seq_date)
    );
END;
GO

CREATE OR ALTER PROCEDURE sp_generate_case_id
    @product VARCHAR(50),
    @case_id VARCHAR(100) OUTPUT
AS
BEGIN
    DECLARE @today CHAR(8) = CONVERT(CHAR(8), GETDATE(), 112);
    DECLARE @next_seq INT;

    IF EXISTS (
        SELECT 1 FROM OF_case_sequence
        WHERE product = @product AND seq_date = @today
    )
    BEGIN
        UPDATE OF_case_sequence
        SET last_seq = last_seq + 1
        WHERE product = @product AND seq_date = @today;

        SELECT @next_seq = last_seq
        FROM OF_case_sequence
        WHERE product = @product AND seq_date = @today;
    END
    ELSE
    BEGIN
        INSERT INTO OF_case_sequence (product, seq_date, last_seq)
        VALUES (@product, @today, 1);
        SET @next_seq = 1;
    END

    SET @case_id = CONCAT(
        'CASE-', UPPER(@product), '-', @today, '-', FORMAT(@next_seq, '0000')
    );
END;
GO

/* =========================================================
   2️⃣ DOCUMENT JOB STATUS
   ========================================================= */
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OF_document_job_status' AND xtype='U')
BEGIN
    CREATE TABLE OF_document_job_status (
        doc_id VARCHAR(100) PRIMARY KEY,
        case_id VARCHAR(100),
        file_path NVARCHAR(500),
        status NVARCHAR(30),
        error_message NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME
    );
END;
GO

CREATE OR ALTER PROCEDURE sp_create_job
    @doc_id VARCHAR(100),
    @case_id VARCHAR(100),
    @file_path NVARCHAR(500)
AS
BEGIN
    INSERT INTO OF_document_job_status
        (doc_id, case_id, file_path, status)
    VALUES
        (@doc_id, @case_id, @file_path, 'QUEUED');
END;
GO

CREATE OR ALTER PROCEDURE sp_update_job_status
    @doc_id VARCHAR(100),
    @status NVARCHAR(30),
    @error_message NVARCHAR(MAX) = NULL
AS
BEGIN
    UPDATE OF_document_job_status
    SET status = @status,
        error_message = @error_message,
        updated_at = GETDATE()
    WHERE doc_id = @doc_id;
END;
GO

/* =========================================================
   3️⃣ DRAFT
   ========================================================= */
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OF_draft' AND xtype='U')
BEGIN
    CREATE TABLE OF_draft (
        session_id VARCHAR(100),
        case_id VARCHAR(100),
        doc_id VARCHAR(100) PRIMARY KEY,
        document_name NVARCHAR(255),
        file_path NVARCHAR(500),
        processed_at DATETIME DEFAULT GETDATE()
    );
END;
GO

CREATE OR ALTER PROCEDURE sp_create_draft
    @session_id VARCHAR(100),
    @case_id VARCHAR(100),
    @doc_id VARCHAR(100),
    @document_name NVARCHAR(255),
    @file_path NVARCHAR(500)
AS
BEGIN
    INSERT INTO OF_draft
        (session_id, case_id, doc_id, document_name, file_path)
    VALUES
        (@session_id, @case_id, @doc_id, @document_name, @file_path);
END;
GO

/* =========================================================
   4️⃣ OCR
   ========================================================= */
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OF_ocr' AND xtype='U')
BEGIN
    CREATE TABLE OF_ocr (
        case_id VARCHAR(100),
        doc_id VARCHAR(100),
        file_path NVARCHAR(500),
        page_no INT,
        extracted_text NVARCHAR(MAX),
        signature_stamp NVARCHAR(MAX),
        CONSTRAINT PK_OF_ocr PRIMARY KEY (doc_id, page_no)
    );
END;
GO

CREATE OR ALTER PROCEDURE sp_insert_ocr_page
    @case_id VARCHAR(100),
    @doc_id VARCHAR(100),
    @file_path NVARCHAR(500),
    @page_no INT,
    @extracted_text NVARCHAR(MAX),
    @signature_stamp NVARCHAR(MAX)
AS
BEGIN
    INSERT INTO OF_ocr
        (case_id, doc_id, file_path, page_no, extracted_text, signature_stamp)
    VALUES
        (@case_id, @doc_id, @file_path, @page_no, @extracted_text, @signature_stamp);
END;
GO

/* =========================================================
   5️⃣ CLASSIFICATION
   ========================================================= */
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OF_classification' AND xtype='U')
BEGIN
    CREATE TABLE OF_classification (
        case_id VARCHAR(100),
        doc_id VARCHAR(100),
        file_path NVARCHAR(500),
        page_no INT,
        classified_code VARCHAR(50),
        classified_name NVARCHAR(255),
        extracted_text NVARCHAR(MAX),
        is_external BIT,
        CONSTRAINT PK_OF_classification PRIMARY KEY (doc_id, page_no)
    );
END;
GO

CREATE OR ALTER PROCEDURE sp_insert_classification
    @case_id VARCHAR(100),
    @doc_id VARCHAR(100),
    @file_path NVARCHAR(500),
    @page_no INT,
    @code VARCHAR(50),
    @name NVARCHAR(255),
    @text NVARCHAR(MAX),
    @is_external BIT
AS
BEGIN
    INSERT INTO OF_classification
        (case_id, doc_id, file_path, page_no,
         classified_code, classified_name, extracted_text, is_external)
    VALUES
        (@case_id, @doc_id, @file_path, @page_no,
         @code, @name, @text, @is_external);
END;
GO

/* =========================================================
   6️⃣ FINAL OCR
   ========================================================= */
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OF_final_ocr' AND xtype='U')
BEGIN
    CREATE TABLE OF_final_ocr (
        case_id VARCHAR(100),
        doc_id VARCHAR(100) PRIMARY KEY,
        file_path NVARCHAR(500),
        whole_text NVARCHAR(MAX),
        documents_json NVARCHAR(MAX),
        processed_at DATETIME DEFAULT GETDATE()
    );
END;
GO

CREATE OR ALTER PROCEDURE sp_insert_final_ocr
    @case_id VARCHAR(100),
    @doc_id VARCHAR(100),
    @file_path NVARCHAR(500),
    @whole_text NVARCHAR(MAX),
    @documents_json NVARCHAR(MAX)
AS
BEGIN
    INSERT INTO OF_final_ocr
        (case_id, doc_id, file_path, whole_text, documents_json)
    VALUES
        (@case_id, @doc_id, @file_path, @whole_text, @documents_json);
END;
GO

/* =========================================================
   7️⃣ DOCUMENT SUMMARY
   ========================================================= */
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OF_document_summary' AND xtype='U')
BEGIN
    CREATE TABLE OF_document_summary (
        case_id VARCHAR(100),
        doc_id VARCHAR(100) PRIMARY KEY,
        file_path NVARCHAR(500),
        document_name NVARCHAR(255),
        product NVARCHAR(50),
        document_list NVARCHAR(500),
        documents_json NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE()
    );
END;
GO

CREATE OR ALTER PROCEDURE sp_insert_document_summary
    @case_id VARCHAR(100),
    @doc_id VARCHAR(100),
    @file_path NVARCHAR(500),
    @document_name NVARCHAR(255),
    @product NVARCHAR(50),
    @document_list NVARCHAR(500),
    @documents_json NVARCHAR(MAX)
AS
BEGIN
    INSERT INTO OF_document_summary
        (case_id, doc_id, file_path, document_name,
         product, document_list, documents_json)
    VALUES
        (@case_id, @doc_id, @file_path, @document_name,
         @product, @document_list, @documents_json);
END;
GO

/* =========================================================
   8️⃣ AUDIT LOG
   ========================================================= */
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OF_audit_log' AND xtype='U')
BEGIN
    CREATE TABLE OF_audit_log (
        id INT IDENTITY PRIMARY KEY,
        case_id VARCHAR(100),
        doc_id VARCHAR(100),
        action NVARCHAR(100),
        message NVARCHAR(MAX),
        source NVARCHAR(50),
        created_at DATETIME DEFAULT GETDATE()
    );
END;
GO

CREATE OR ALTER PROCEDURE sp_write_audit_log
    @case_id VARCHAR(100),
    @doc_id VARCHAR(100),
    @action NVARCHAR(100),
    @message NVARCHAR(MAX),
    @source NVARCHAR(50)
AS
BEGIN
    INSERT INTO OF_audit_log
        (case_id, doc_id, action, message, source)
    VALUES
        (@case_id, @doc_id, @action, @message, @source);
END;
GO

/* =========================================================
   9️⃣ ERROR LOG
   ========================================================= */
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OF_error_log' AND xtype='U')
BEGIN
    CREATE TABLE OF_error_log (
        id INT IDENTITY PRIMARY KEY,
        case_id VARCHAR(100),
        doc_id VARCHAR(100),
        step NVARCHAR(100),
        error_message NVARCHAR(MAX),
        stack_trace NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE()
    );
END;
GO

CREATE OR ALTER PROCEDURE sp_write_error_log
    @case_id VARCHAR(100),
    @doc_id VARCHAR(100),
    @step NVARCHAR(100),
    @error_message NVARCHAR(MAX),
    @stack_trace NVARCHAR(MAX)
AS
BEGIN
    INSERT INTO OF_error_log
        (case_id, doc_id, step, error_message, stack_trace)
    VALUES
        (@case_id, @doc_id, @step, @error_message, @stack_trace);
END;
GO

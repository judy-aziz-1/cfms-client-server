import sqlite3
from utils.security import get_password_hash

def initialize_database():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # 1. Create the users table fully in accordance with the technical documentation (page 5)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 2. Setting up the first Admin account according to the operating guide (page 11)
    admin_name = "Admin User"
    admin_email = "admin@cfms.com"
    # Encryption, and the password approved in the project is 12345678
    admin_password_hash = get_password_hash("12345678") 
    
    try:
        cursor.execute('''
        INSERT INTO users (name, email, password, role, is_active)
        VALUES (?, ?, ?, ?, ?)
        ''', (admin_name, admin_email, admin_password_hash, 'admin', 1))
        conn.commit()
        print(f"✅ The database and the administrator account have been successfully created, in accordance with the technical documentation!")
        print(f"📧 Email: {admin_email} | 🔑 Password: 12345678")
    except sqlite3.IntegrityError:
        print("⚠️ The administrator account already exists in the database.")
    
    conn.close()

if __name__ == "__main__":
    initialize_database()
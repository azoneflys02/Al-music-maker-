# Firestore Security Specification

## Data Invariants
1. A track must belong to exactly one user via `userId`.
2. Users can only access (read/write) their own data.
3. Track IDs must be valid.
4. Timestamps must be server-validated.

## The Dirty Dozen Payloads
- T-01: Create track with someone else's `userId`.
- T-02: Create track without `userId`.
- T-03: Create track with huge title (> 1024 chars).
- T-04: Read someone else's track by ID.
- T-05: List all tracks (blanket read).
- T-06: Update someone else's track.
- T-07: Update `userId` of a track to another user.
- T-08: Update `createdAt` of a track.
- T-09: Create track with invalid instruments (not an array).
- T-10: Create track with negative BPM.
- T-11: Delete someone else's track.
- T-12: Update track with unauthorized fields (e.g. `isAdmin: true`).

## Expected Results
All "Dirty Dozen" payloads must return `PERMISSION_DENIED`.

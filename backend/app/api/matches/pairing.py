import random
from typing import List, Tuple, Set, Optional
from .models import Match
from backend.app.api.participants.models import Participant


def get_pairings(
    participants: List[Participant], past_matches: List[Match]
) -> List[Tuple[Participant, Optional[Participant]]]:
    """
    Generate Swiss pairings for the next round.
    participants: List of participants in the tournament.
    past_matches: List of all matches already played/paired in this tournament.
    """
    # Sort participants by points descending, then randomize within point brackets
    # Actually, to randomize within brackets, we can shuffle first then sort
    shuffled_participants = list(participants)
    random.shuffle(shuffled_participants)
    sorted_participants = sorted(
        shuffled_participants, key=lambda p: p.points, reverse=True
    )

    # Track who has played whom
    played_map: Set[Tuple[int, int]] = set()
    bye_players: Set[int] = set()

    for m in past_matches:
        if m.is_bye:
            if m.player1_id:
                bye_players.add(m.player1_id)
        elif m.player1_id and m.player2_id:
            p1, p2 = sorted([m.player1_id, m.player2_id])
            played_map.add((p1, p2))

    pairings: List[Tuple[Participant, Optional[Participant]]] = []
    unpaired = list(sorted_participants)

    # Handle BYE for odd number of players
    if len(unpaired) % 2 != 0:
        # Find the player with lowest score who hasn't had a bye
        for i in range(len(unpaired) - 1, -1, -1):
            if unpaired[i].id not in bye_players:
                bye_p = unpaired.pop(i)
                pairings.append((bye_p, None))
                break
        else:
            # If everyone had a bye, just give it to the last one (should not happen in normal Swiss rounds count)
            bye_p = unpaired.pop()
            pairings.append((bye_p, None))

    # Simple matching algorithm (can be improved with Blossom algorithm for perfect matching,
    # but for Swiss, a greedy approach with backtracking is common)
    def find_matches(
        remaining: List[Participant],
    ) -> Optional[List[Tuple[Participant, Participant]]]:
        if not remaining:
            return []

        p1 = remaining[0]
        for i in range(1, len(remaining)):
            p2 = remaining[i]
            p1_id, p2_id = sorted([p1.id, p2.id])

            if (p1_id, p2_id) not in played_map:
                # Potential match
                rest = remaining[1:i] + remaining[i + 1 :]
                sub_matches = find_matches(rest)
                if sub_matches is not None:
                    return [(p1, p2)] + sub_matches

        return None

    matches = find_matches(unpaired)
    if matches is None:
        # If no perfect matching without repeats exists, relax the constraint
        # In a real Swiss system, you'd try to minimize repeats or use a more complex algorithm
        # For this MVP, we'll just pair greedily even with repeats if necessary
        matches = []
        already_paired = set()
        for i in range(len(unpaired)):
            if unpaired[i].id in already_paired:
                continue
            p1 = unpaired[i]
            already_paired.add(p1.id)

            p2 = None
            for j in range(i + 1, len(unpaired)):
                if unpaired[j].id not in already_paired:
                    p2 = unpaired[j]
                    already_paired.add(p2.id)
                    break

            if p2:
                matches.append((p1, p2))
            else:
                # Should not happen as we handle bye first
                pairings.append((p1, None))

    pairings.extend(matches)
    return pairings

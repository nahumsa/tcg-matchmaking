from backend.app.api.participants.models import Participant
from backend.app.api.matches.models import Match
from backend.app.api.matches.pairing import get_pairings


def test_even_players_pairing():
    p1 = Participant(id=1, name="P1", points=3)
    p2 = Participant(id=2, name="P2", points=3)
    p3 = Participant(id=3, name="P3", points=0)
    p4 = Participant(id=4, name="P4", points=0)

    participants = [p1, p2, p3, p4]
    pairings = get_pairings(participants, [])

    assert len(pairings) == 2
    # p1 and p2 should be paired, p3 and p4 should be paired
    for pair in pairings:
        p_a, p_b = pair
        assert p_b is not None
        if p_a.id == 1:
            assert p_b.id == 2
        elif p_a.id == 2:
            assert p_b.id == 1
        elif p_a.id == 3:
            assert p_b.id == 4
        elif p_a.id == 4:
            assert p_b.id == 3


def test_odd_players_pairing_with_bye():
    p1 = Participant(id=1, name="P1", points=3)
    p2 = Participant(id=2, name="P2", points=3)
    p3 = Participant(id=3, name="P3", points=0)

    participants = [p1, p2, p3]
    pairings = get_pairings(participants, [])

    assert len(pairings) == 2
    # The bye player should be the lowest point player
    bye_pair = [p for p in pairings if p[1] is None][0]
    assert bye_pair[0].id == 3

    # p1 and p2 should be paired
    match_pair = [p for p in pairings if p[1] is not None][0]
    ids = {match_pair[0].id, match_pair[1].id}
    assert ids == {1, 2}


def test_avoid_repeat_matchups():
    p1 = Participant(id=1, name="P1", points=3)
    p2 = Participant(id=2, name="P2", points=3)
    p3 = Participant(id=3, name="P3", points=3)
    p4 = Participant(id=4, name="P4", points=3)

    # Round 1 matches: (1, 2), (3, 4)
    m1 = Match(player1_id=1, player2_id=2, round_number=1, is_bye=0)
    m2 = Match(player1_id=3, player2_id=4, round_number=1, is_bye=0)

    participants = [p1, p2, p3, p4]
    pairings = get_pairings(participants, [m1, m2])

    assert len(pairings) == 2
    for p_a, p_b in pairings:
        assert p_b is not None
        # P1 should NOT be paired with P2 again
        if p_a.id == 1:
            assert p_b.id != 2
        if p_b.id == 1:
            assert p_a.id != 2
        # P3 should NOT be paired with P4 again
        if p_a.id == 3:
            assert p_b.id != 4
        if p_b.id == 3:
            assert p_a.id != 4


def test_bye_player_cannot_get_bye_twice():
    p1 = Participant(id=1, name="P1", points=3)
    p2 = Participant(id=2, name="P2", points=0)
    p3 = Participant(id=3, name="P3", points=0)

    # P2 already had a bye
    m1 = Match(player1_id=2, player2_id=None, round_number=1, is_bye=1)

    participants = [p1, p2, p3]
    pairings = get_pairings(participants, [m1])

    # Bye player should be P3 (lowest available score who didn't have a bye)
    bye_pair = [p for p in pairings if p[1] is None][0]
    assert bye_pair[0].id == 3

    # P1 and P2 paired
    match_pair = [p for p in pairings if p[1] is not None][0]
    ids = {match_pair[0].id, match_pair[1].id}
    assert ids == {1, 2}

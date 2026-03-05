from sqlalchemy.orm import Session
from typing import List
from backend.app.api.participants.models import Participant
from backend.app.api.matches.models import Match
from backend.app.api.participants.schemas import ParticipantResponse


def calculate_standings(db: Session, tournament_id: int) -> List[ParticipantResponse]:
    """Calculates tournament standings including points and OMW%.

    Args:
        db: Database session.
        tournament_id: ID of the tournament.

    Returns:
        List of participants with their current rank and stats.
    """
    participants = (
        db.query(Participant).filter(Participant.tournament_id == tournament_id).all()
    )
    matches = (
        db.query(Match)
        .filter(Match.tournament_id == tournament_id, Match.is_completed == 1)
        .all()
    )

    # Initialize stats for each participant
    stats = {
        p.id: {
            "id": p.id,
            "name": p.name,
            "tournament_id": p.tournament_id,
            "points": 0,
            "wins": 0,
            "losses": 0,
            "draws": 0,
            "opponents": [],
            "match_win_percentage": 0.0,
        }
        for p in participants
    }

    # Process matches
    for m in matches:
        if m.is_bye:
            if m.player1_id in stats:
                stats[m.player1_id]["points"] += 3
                stats[m.player1_id]["wins"] += 1
            continue

        p1_id, p2_id = m.player1_id, m.player2_id
        if p1_id not in stats or p2_id not in stats:
            continue

        stats[p1_id]["opponents"].append(p2_id)
        stats[p2_id]["opponents"].append(p1_id)

        if m.player1_score > m.player2_score:
            stats[p1_id]["points"] += 3
            stats[p1_id]["wins"] += 1
            stats[p2_id]["losses"] += 1
        elif m.player2_score > m.player1_score:
            stats[p2_id]["points"] += 3
            stats[p2_id]["wins"] += 1
            stats[p1_id]["losses"] += 1
        else:
            stats[p1_id]["points"] += 1
            stats[p2_id]["points"] += 1
            stats[p1_id]["draws"] += 1
            stats[p2_id]["draws"] += 1

    # Calculate Match Win Percentage (MWP) for each player
    # MWP = max(0.33, points / (3 * matches_played))
    for p_id, s in stats.items():
        played = s["wins"] + s["losses"] + s["draws"]
        if played == 0:
            s["match_win_percentage"] = 0.33
        else:
            mwp = s["points"] / (3 * played)
            s["match_win_percentage"] = max(0.33, mwp)

    # Calculate Opponent Match Win Percentage (OMWP)
    for p_id, s in stats.items():
        if not s["opponents"]:
            s["omw_percentage"] = 0.33
        else:
            opp_mwp_sum = sum(
                stats[opp_id]["match_win_percentage"] for opp_id in s["opponents"]
            )
            s["omw_percentage"] = opp_mwp_sum / len(s["opponents"])

    # Sort participants
    # Primary: Points, Secondary: OMW%, Tertiary: Name (for stability)
    sorted_stats = sorted(
        stats.values(),
        key=lambda x: (x["points"], x["omw_percentage"], x["name"]),
        reverse=True,
    )

    # Assign ranks
    result = []
    for i, s in enumerate(sorted_stats):
        s["rank"] = i + 1
        result.append(ParticipantResponse(**s))

    return result

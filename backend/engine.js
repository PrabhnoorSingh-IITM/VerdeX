/**
 * VerdeX Governance Engine
 * Strictly aligned with Gravity Constants and Scoring Logic.
 */

const SEVERITY_TARGETS = {
    critical: 4,     // 4 hours
    high: 24,       // 24 hours
    medium: 72,     // 3 days
    low: 168        // 7 days
};

const ZONE_RADIUS_METERS = 10;
const BREACH_PENALTY_LIMIT = 15;

/**
 * OT_Compliance (40% Weight)
 * Based on whether issue was resolved within V1 targets.
 */
function calculateOTCompliance(resolutionTimeHours, severity) {
    const target = SEVERITY_TARGETS[severity] || 72;
    return resolutionTimeHours <= target ? 100 : 0;
}

/**
 * Resolution_Speed (30% Weight)
 * V1 Logic: Comparison of actual resolution time vs. institutional benchmarks.
 * We use the Severity Target as the benchmark.
 */
function calculateResolutionSpeed(resolutionTimeHours, severity) {
    const target = SEVERITY_TARGETS[severity] || 72;
    // V1 Bonus logic: points awarded for speed.
    // For V2 S calculation, we'll use a linear score capped at 100.
    const score = (1 - (resolutionTimeHours / (target * 2))) * 100; // Linear decay, 0 at 2x target
    return Math.max(0, Math.min(100, score));
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Non_Recurrence (30% Weight)
 * Deduplication and hotspot prevention (recurring type in same 10m zone).
 */
function calculateNonRecurrence(newIssue, historicalIssues) {
    const nearbyRecurring = historicalIssues.filter(issue => {
        if (issue.id === newIssue.id) return false;
        if (issue.type !== newIssue.type) return false; // Must be same type in V1
        const distance = calculateDistance(
            newIssue.lat, newIssue.lng,
            issue.lat, issue.lng
        );
        return distance <= ZONE_RADIUS_METERS;
    });

    return nearbyRecurring.length === 0 ? 100 : (nearbyRecurring.length === 1 ? 50 : 0);
}

/**
 * Breach Penalty Calculation
 * V1: sum of active penalties for overdue critical/high issues.
 * Penalty: severity_base (critical 40, high 30...)
 */
function calculateBreachPenalty(openIssues) {
    let penaltyTotal = 0;
    const now = Date.now();

    openIssues.forEach(issue => {
        const target = SEVERITY_TARGETS[issue.severity] || 72;
        const hoursOpen = (now - issue.createdAt) / (1000 * 60 * 60);
        
        if (hoursOpen > target) {
            // Overdue penalty
            if (issue.severity === 'critical') penaltyTotal += 5;
            if (issue.severity === 'high') penaltyTotal += 3;
        }
    });

    return Math.min(BREACH_PENALTY_LIMIT, penaltyTotal);
}

/**
 * Final V1-Standard Campus Score Calculation
 */
export function calculateCampusScore(resolvedIssues, allIssues) {
    if (allIssues.length === 0) return 100;

    const openIssues = allIssues.filter(i => i.status !== 'verified');
    const resolvedCount = resolvedIssues.length;

    let totalS = 0;

    resolvedIssues.forEach(issue => {
        const resolutionTimeHours = (issue.resolvedAt - issue.createdAt) / (1000 * 60 * 60);
        
        const ot = calculateOTCompliance(resolutionTimeHours, issue.severity);
        const speed = calculateResolutionSpeed(resolutionTimeHours, issue.severity);
        const nr = calculateNonRecurrence(issue, allIssues);

        const issueScore = (0.40 * ot) + (0.30 * speed) + (0.30 * nr);
        totalS += issueScore;
    });

    const averageResolutionScore = resolvedCount > 0 ? (totalS / resolvedCount) : 100;
    const penalty = calculateBreachPenalty(openIssues);

    let finalScore = averageResolutionScore - penalty;
    return Math.max(0, Math.min(100, finalScore));
}

/**
 * Trustless Verification Loop (Gemini Mock)
 * Simulates analyzing the 'Before' and 'After' photo and verifying resolution.
 */
export async function geminiVerifier(issueId, dbInstance) {
    console.log(`[Gemini Verifier] AI Agent evaluating resolution proof for Issue #${issueId}...`);
    
    // Simulate API delay
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`[Gemini Verifier] Analysis complete: High Confidence Match.`);
            // Update Firestore record via db.js instance
            dbInstance.verifyIssue(issueId);
            resolve({
                verified: true,
                confidence: 0.94,
                agentNotes: "Visual analysis confirms the described issue no longer exists. Safe to award points."
            });
        }, 3000);
    });
}

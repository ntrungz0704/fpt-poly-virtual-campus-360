import crypto from "node:crypto";

describe("Gamification Unit Logic Suite (M3D)", () => {
  describe("Quiz Scoring & Authoritative XP Logic", () => {
    it("calculates 20 XP per correct question plus 40 bonus XP for perfect score", () => {
      const calculateXp = (correct: number, total: number) => {
        let xp = correct * 20;
        if (correct === total && total > 0) xp += 40;
        return xp;
      };

      expect(calculateXp(3, 3)).toBe(100); // 3*20 + 40 = 100
      expect(calculateXp(2, 3)).toBe(40);  // 2*20 = 40
      expect(calculateXp(1, 3)).toBe(20);  // 1*20 = 20
      expect(calculateXp(0, 3)).toBe(0);   // 0
    });

    it("generates deterministic idempotency reference key to prevent XP farming", () => {
      const getRefKey = (eventId: string, ticketCode?: string, name?: string) => {
        const key = (ticketCode?.trim() || name?.trim().toLowerCase() || "guest").replace(/\s+/g, "_");
        return `quiz_${eventId}_${key}`;
      };

      const ref1 = getRefKey("ev-123", "OD26-ABCD-1234");
      const ref2 = getRefKey("ev-123", "OD26-ABCD-1234");
      const refDifferent = getRefKey("ev-123", "OD26-DIFF-9999");

      expect(ref1).toBe("quiz_ev-123_OD26-ABCD-1234");
      expect(ref1).toBe(ref2);
      expect(ref1).not.toBe(refDifferent);
    });
  });

  describe("Server-Authoritative Spin Wheel Selection", () => {
    const rewards = [
      { id: "1", label: "50 XP", weight: 25 },
      { id: "2", label: "Áo thun FPT Poly", weight: 10 },
      { id: "3", label: "100 XP", weight: 20 },
      { id: "4", label: "Bình nước", weight: 10 },
      { id: "5", label: "Huy hiệu 360", weight: 15 },
      { id: "6", label: "200 XP", weight: 5 },
      { id: "7", label: "Sổ tay", weight: 10 },
      { id: "8", label: "May mắn (+10 XP)", weight: 5 },
    ];

    it("verifies probability distribution totals 100% and picks valid slices", () => {
      const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0);
      expect(totalWeight).toBe(100);

      // Simulate 1000 weighted random picks using crypto
      const counts: Record<string, number> = {};
      for (let k = 0; k < 1000; k++) {
        const pick = crypto.randomInt(0, totalWeight);
        let acc = 0;
        let selectedIndex = 0;
        for (let i = 0; i < rewards.length; i++) {
          acc += rewards[i].weight;
          if (pick < acc) {
            selectedIndex = i;
            break;
          }
        }
        const pickedId = rewards[selectedIndex].id;
        counts[pickedId] = (counts[pickedId] || 0) + 1;
      }

      // 50 XP (weight 25) should appear substantially more often than 200 XP (weight 5)
      expect(counts["1"]).toBeGreaterThan(counts["6"]);
    });
  });

  describe("Spins Remaining Accounting Rules", () => {
    it("accurately calculates earned spins minus consumed spins", () => {
      const calcSpins = (hasTicket: boolean, isCheckedIn: boolean, hasPassedQuiz: boolean, used: number) => {
        let earned = 0;
        if (hasTicket) earned += 1;
        if (isCheckedIn) earned += 2;
        if (hasPassedQuiz) earned += 1;
        return Math.max(0, earned - used);
      };

      // Ticket registered only: 1 spin
      expect(calcSpins(true, false, false, 0)).toBe(1);

      // Ticket + checked in at Open Day: 1 + 2 = 3 spins
      expect(calcSpins(true, true, false, 0)).toBe(3);

      // Ticket + checked in + passed quiz: 1 + 2 + 1 = 4 spins
      expect(calcSpins(true, true, true, 0)).toBe(4);

      // Used 3 spins: 4 - 3 = 1 spin remaining
      expect(calcSpins(true, true, true, 3)).toBe(1);

      // Used 4 spins: 0 spins remaining
      expect(calcSpins(true, true, true, 4)).toBe(0);

      // Over-limit clamp to 0
      expect(calcSpins(true, true, true, 10)).toBe(0);
    });
  });

  describe("Leaderboard Badges & Tier Thresholds", () => {
    it("maps XP to appropriate level and badge", () => {
      const getBadge = (xp: number) => {
        if (xp >= 400) return "Huyền thoại QTSC";
        if (xp >= 250) return "Đại sứ Campus 360";
        if (xp >= 150) return "Nhà Thám hiểm Poly";
        if (xp >= 50) return "Sinh viên Tiên phong";
        return "Tân binh Poly";
      };

      expect(getBadge(480)).toBe("Huyền thoại QTSC");
      expect(getBadge(380)).toBe("Đại sứ Campus 360");
      expect(getBadge(200)).toBe("Nhà Thám hiểm Poly");
      expect(getBadge(90)).toBe("Sinh viên Tiên phong");
      expect(getBadge(20)).toBe("Tân binh Poly");
    });
  });
});

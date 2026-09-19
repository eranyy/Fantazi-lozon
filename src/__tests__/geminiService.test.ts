import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeMatchImage, generateAISummary, generateRumors, getTacticalAdvice, analyzeDraft, analyzeLiveScoring } from '../geminiService';

// Mock the GoogleGenAI class
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  return {
    Type: {
      ARRAY: 'ARRAY',
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      INTEGER: 'INTEGER',
      NUMBER: 'NUMBER',
      BOOLEAN: 'BOOLEAN'
    },
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
      constructor(config: any) {
        // we can also track the constructor arguments if we want to spy on them
        (this as any).config = config;
        mockGoogleGenAIConstructor(config);
      }
    },
  };
});
const mockGoogleGenAIConstructor = vi.fn();

describe('geminiService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.useRealTimers();
  });

  describe('analyzeMatchImage', () => {
    it('should extract JSON from markdown successfully', async () => {
      const mockResponse = {
        text: '```json\n[{"round": 1, "homeTeam": "מכבי תל אביב", "awayTeam": "מכבי חיפה", "date": "10.05", "time": "20:00", "stadium": "בלומפילד", "tvChannel": "ספורט 5"}]\n```'
      };
      // We need to simulate the async resolution, but since there's a Promise.race with a timeout in the source code, we use vi.fn().mockResolvedValue
      mockGenerateContent.mockResolvedValue(mockResponse);

      const promise = analyzeMatchImage('base64string', 'image/png', '1');
      // Advance timers so the request completes before timeout
      vi.runAllTimers();

      const result = await promise;

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result).toEqual([{
        round: 1,
        homeTeam: "מכבי תל אביב",
        awayTeam: "מכבי חיפה",
        date: "10.05",
        time: "20:00",
        stadium: "בלומפילד",
        tvChannel: "ספורט 5"
      }]);
    });

    it('should use provided API key if available', async () => {
      mockGenerateContent.mockResolvedValue({ text: '[]' });

      const promise = analyzeMatchImage('base64string', 'image/png', '1', 'provided-key');
      vi.runAllTimers();
      await promise;

      expect(mockGoogleGenAIConstructor).toHaveBeenCalledWith({ apiKey: 'provided-key' });
    });

    it('should fallback to env variable if no key is provided', async () => {
        mockGenerateContent.mockResolvedValue({ text: '[]' });

        vi.stubEnv('VITE_GEMINI_API_KEY', 'env-key');

        const promise = analyzeMatchImage('base64string', 'image/png', '1');
        vi.runAllTimers();
        await promise;

        expect(mockGoogleGenAIConstructor).toHaveBeenCalledWith({ apiKey: 'env-key' });
        vi.unstubAllEnvs();
    });

    it('should throw error on timeout', async () => {
      // Mock a promise that never resolves
      mockGenerateContent.mockImplementation(() => new Promise(() => {}));

      const promise = analyzeMatchImage('base64string', 'image/png', '1');

      // Fast-forward past the 45-second timeout
      vi.advanceTimersByTime(46000);

      await expect(promise).rejects.toThrow(/שגיאת התחברות לשרת ה-AI/);
    });

    it('should throw error on invalid JSON', async () => {
        const mockResponse = {
          text: 'This is not valid JSON'
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const promise = analyzeMatchImage('base64string', 'image/png', '1');
        vi.runAllTimers();

        await expect(promise).rejects.toThrow(/שגיאת התחברות לשרת ה-AI/);
    });
  });

  describe('generateAISummary', () => {
    it('should generate summary successfully', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Summary text' });

      const teams = [
        { id: '1', teamName: 'Team A', name: 'Manager A', points: 10, gf: 5, ga: 1 },
        { id: '2', teamName: 'Team B', name: 'Manager B', points: 15, gf: 10, ga: 2 },
      ];
      const fixtures = [
        { homeTeam: 'Team A', awayTeam: 'Team B' }
      ];

      const promise = generateAISummary(fixtures, teams);
      vi.runAllTimers();
      const result = await promise;

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result).toBe('Summary text');
    });

    it('should sort teams correctly and exclude admin/system', async () => {
        mockGenerateContent.mockResolvedValue({ text: 'Summary text' });

        const teams = [
          { id: 'admin', teamName: 'Admin' },
          { id: 'system', teamName: 'System' },
          { id: '1', teamName: 'Team A', name: 'Manager A', points: 10, gf: 5, ga: 1 },
          { id: '2', teamName: 'Team B', name: 'Manager B', points: 15, gf: 10, ga: 2 }, // Higher points
          { id: '3', teamName: 'Team C', name: 'Manager C', points: 10, gf: 6, ga: 1 }, // Same points, better GD
        ];
        const fixtures: any[] = [];

        const promise = generateAISummary(fixtures, teams);
        vi.runAllTimers();
        await promise;

        const promptUsed = mockGenerateContent.mock.calls[0][0].contents;
        // Verify 'Team B' is 1st, 'Team C' is 2nd, 'Team A' is 3rd, and 'Admin'/'System' are not there
        expect(promptUsed).toContain('מקום 1: Team B');
        expect(promptUsed).toContain('מקום 2: Team C');
        expect(promptUsed).toContain('מקום 3: Team A');
        expect(promptUsed).not.toContain('Admin');
        expect(promptUsed).not.toContain('System');
    });

    it('should use provided custom apiKey if supplied', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Summary text' });
      const teams = [{ id: '1', teamName: 'Team A', name: 'Manager A', points: 10 }];
      const fixtures: any[] = [];

      const promise = generateAISummary(fixtures, teams, 'custom-summary-key');
      vi.runAllTimers();
      await promise;

      expect(mockGoogleGenAIConstructor).toHaveBeenCalledWith({ apiKey: 'custom-summary-key' });
    });

    it('should throw error when generateAISummary times out or fails', async () => {
      mockGenerateContent.mockImplementation(() => new Promise(() => {}));

      const teams = [{ id: '1', teamName: 'Team A', points: 10 }];
      const promise = generateAISummary([], teams);
      vi.runAllTimers();

      await expect(promise).rejects.toThrow();
    });
  });

  describe('generateRumors', () => {
    it('should generate rumors successfully', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Rumors text' });

      const teams = [
        { id: '1', teamName: 'Team A', name: 'Manager A', squad: [{ name: 'Player 1' }, { name: 'Player 2' }] },
      ];

      const promise = generateRumors(teams);
      vi.runAllTimers();
      const result = await promise;

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result).toBe('Rumors text');
    });

    it('should handle teams with no players', async () => {
        mockGenerateContent.mockResolvedValue({ text: 'Rumors text' });

        const teams = [
          { id: '1', teamName: 'Team A', name: 'Manager A' }, // no squad
        ];

        const promise = generateRumors(teams);
        vi.runAllTimers();
        await promise;

        const promptUsed = mockGenerateContent.mock.calls[0][0].contents;
        expect(promptUsed).toContain('אין שחקנים כרגע');
    });
  });

  describe('structured output functions', () => {
    it('should generate tactical advice JSON successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          recommendedFormation: '4-3-3',
          captainChoice: 'Player 1',
          substituteSuggestions: ['Sub 1'],
          transferRecommendation: 'Transfer 1',
          confidenceScore: 92
        })
      });

      const squad = [{ name: 'Player 1', position: 'FWD', points: 10 }];
      const promise = getTacticalAdvice(squad, 'Team B');
      vi.runAllTimers();
      const res = await promise;

      expect(res.recommendedFormation).toBe('4-3-3');
      expect(res.confidenceScore).toBe(92);
    });

    it('should throw error when getTacticalAdvice times out or fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network error'));

      const squad = [{ name: 'Player 1', position: 'FWD', points: 10 }];
      const promise = getTacticalAdvice(squad, 'Team B');
      vi.runAllTimers();

      await expect(promise).rejects.toThrow('Network error');
    });

    it('should analyze draft JSON successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          draftGrade: 'A+',
          squadBalanceScore: 95,
          topSleeperPicks: ['Sleeper 1'],
          keyRisks: ['Risk 1'],
          summaryAdvice: 'Great draft'
        })
      });

      const squad = [{ name: 'Player 1', position: 'FWD', team: 'Maccabi Haifa' }];
      const promise = analyzeDraft(squad, 'Hamsili');
      vi.runAllTimers();
      const res = await promise;

      expect(res.draftGrade).toBe('A+');
      expect(res.squadBalanceScore).toBe(95);
    });

    it('should analyze live scoring JSON successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          currentWinner: 'Hamsili',
          liveHighlights: ['Goal in min 80'],
          gameChangerPlayer: 'Player 1',
          winProbabilityPercent: 88
        })
      });

      const matchData = { homeScore: 2, awayScore: 1 };
      const promise = analyzeLiveScoring(matchData);
      vi.runAllTimers();
      const res = await promise;

      expect(res.currentWinner).toBe('Hamsili');
      expect(res.winProbabilityPercent).toBe(88);
    });
  });
});

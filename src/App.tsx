import './App.css';
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

type GoalType = 'count' | 'rate';

type GoalData = {
  targetText: string;
  targetNumber: string;
  targetType: GoalType;
  targetValue: string;
  dailyRecords: DailyRecord[];
};

type DailyRecord = {
  date: string;
  answerCount: string;
  correctCount: string;
};

// -- ログイン・会員登録コンポーネント --
function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert('メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert(`登録エラー: ${error.message}`);
      } else {
        alert('登録が完了しました！そのままログインできます。');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert(`ログインエラー: ${error.message}`);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '320px', margin: '40px auto', textAlign: 'center' }}>
      <h2>{isSignUp ? '新規アカウント登録' : 'ログイン'}</h2>
      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="パスワード (6文字以上)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? '処理中...' : isSignUp ? '登録する' : 'ログイン'}
        </button>
      </form>
      <p style={{ marginTop: '15px', fontSize: '14px' }}>
        {isSignUp ? 'すでにアカウントをお持ちですか？' : 'アカウントをお持ちでないですか？'}
        <br />
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ marginTop: '5px', background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isSignUp ? 'ログイン画面へ' : '新規登録画面へ'}
        </button>
      </p>
    </div>
  );
}

function DataLabel({ label, onClick }: { label: string; onClick: () => void }) {
  const isNew = label === "新しい目標を登録する";
  return (
    <button
      onClick={onClick}
      className={isNew ? 'goal-card-empty' : 'goal-card'}
      style={{
        display: 'block',
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto 16px',
        padding: '24px 20px',
        background: isNew ? '#f8f9fa' : 'white',
        border: isNew ? '1px dashed #ccc' : '1px solid #e0e0e0',
        borderRadius: '12px',
        boxShadow: isNew ? 'none' : '0 4px 12px rgba(0,0,0,0.03)',
        color: isNew ? '#666' : '#333',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        textAlign: 'center'
      }}
    >
      {isNew ? `＋ ${label}` : label}
    </button>
  );
}

function InputForm({ initialData, onSave, onCancel, onDelete }: { initialData?: GoalData, onSave: (text: string, inputNumber: string, targetType: GoalType, targetValue: string) => void, onCancel: () => void, onDelete?: () => void }) {
  const [inputText, setInputText] = useState(initialData?.targetText || "");
  const [inputNumber, setInputNumber] = useState(initialData?.targetNumber || "");
  const [targetType, setTargetType] = useState<GoalType>(initialData?.targetType || 'count');
  const [targetValue, setTargetValue] = useState(initialData?.targetValue || "");

  const handleTypeChange = (type: GoalType) => {
    setTargetType(type);
    setTargetValue("");
  };
  const rateOptions = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);

  return (
    <div style={{ background: '#f8f9fa', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', maxWidth: '500px', margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#333', textAlign: 'center' }}>{initialData ? "目標データを編集する" : "新しい目標を設定する"}</h2>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>1. 目標のタイトル</label>
        <input type="text" placeholder="例：宅建の過去問を毎日解く" value={inputText} onChange={(e) => setInputText(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
      </div>

      <div style={{ background: 'white', padding: '16px', borderRadius: '6px', border: '1px solid #e0e0e0', marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: '#555' }}>2. 毎日のノルマ</label>

        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>目標とする回答数</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="number" min="1" placeholder="10" value={inputNumber} onChange={(e) => setInputNumber(e.target.value)} style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <span style={{ fontSize: '14px', color: '#333' }}>問 / 日</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #ddd', paddingTop: '16px' }}>
          <span style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '12px' }}>達成条件（どちらかを選択）</span>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', cursor: 'pointer', color: '#333' }}>
              <input type="radio" name="targetType" value="count" checked={targetType === 'count'} onChange={() => handleTypeChange('count')} />
              正解数で指定
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', cursor: 'pointer', color: '#333' }}>
              <input type="radio" name="targetType" value="rate" checked={targetType === 'rate'} onChange={() => handleTypeChange('rate')} />
              正答率で指定
            </label>
          </div>

          {targetType === 'count' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="number" min="1" placeholder="8" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <span style={{ fontSize: '14px', color: '#333' }}>問以上 正解する</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select value={targetValue} onChange={(e) => setTargetValue(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '80px' }}>
                <option value="">選択</option>
                {rateOptions.map((value) => (
                  <option key={value} value={value}>{value}%</option>
                ))}
              </select>
              <span style={{ fontSize: '14px', color: '#333' }}>以上 正解する</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '12px', background: '#f5f5f5', color: '#555', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
          戻る
        </button>
        <button onClick={() => {
          if (!inputText.trim() || !inputNumber.trim() || !targetValue.trim()) {
            alert("すべての項目を入力してください");
            return;
          }
          onSave(inputText, inputNumber, targetType, targetValue);
        }} style={{ flex: 2, padding: '12px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
          保存する
        </button>
      </div>

      {onDelete && (
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #eee', textAlign: 'center' }}>
          <button onClick={() => {
            if (window.confirm("本当にこの目標のデータをすべて削除しますか？\nこれまでの毎日の記録データも完全に消去されます。\nこの操作は取り消せません。")) {
              onDelete();
            }
          }} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}>
            この目標を削除する
          </button>
        </div>
      )}
    </div>
  );
}

function ProgressScreen({ slotId, setGoal, onBack, targetText, targetNumber, dailyRecords, targetType, targetValue, createdAt, }: { slotId: number, setGoal: ((goal: GoalData | null) => void) | null, onBack: () => void, targetText: string; targetNumber: string; dailyRecords: DailyRecord[], targetType: GoalType, targetValue: string, createdAt: string }) {
  type PeriodRange = '7days' | '30days' | 'all';
  const [period, setPeriod] = useState<PeriodRange>('7days');

  const formatDate = (d: Date) => {
    const year = String(d.getFullYear());
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getRecordForDate = (dateString: string): DailyRecord | null => {
    return dailyRecords.find((record) => record.date === dateString) || null;
  };

  const [date, setDate] = useState(() => formatDate(new Date()));
  const [showRecordForm, setShowRecordForm] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setShowRecordForm(window.location.hash.endsWith('/record'));
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [answerCount, setAnswerCount] = useState("");
  const [correctCount, setCorrectCount] = useState("");

  useEffect(() => {
    const todayStr = formatDate(new Date());
    const todayRecord = getRecordForDate(todayStr);
    if (todayRecord) {
      setAnswerCount(todayRecord.answerCount);
      setCorrectCount(todayRecord.correctCount);
    } else {
      setAnswerCount("");
      setCorrectCount("");
    }
  }, []);

  const isAnswerAchieved = (record: DailyRecord): boolean => {
    const currentAnswer = parseInt(record.answerCount) || 0;
    const targetNumberValue = parseInt(targetNumber) || 0;
    return currentAnswer >= targetNumberValue;
  };

  const isAccuracyAchieved = (record: DailyRecord): boolean => {
    const currentAnswer = parseInt(record.answerCount) || 0;
    const currentCorrect = parseInt(record.correctCount) || 0;
    const targetValueNumber = parseInt(targetValue) || 0;
    if (targetType === "count") {
      return currentCorrect >= targetValueNumber;
    } else {
      if (currentAnswer === 0) return false;
      const currentRate = (currentCorrect / currentAnswer) * 100;
      return currentRate >= targetValueNumber;
    }
  };

  const handleDeleteDailyRecord = (targetDate: string) => {
    if (!window.confirm("本当に削除しますか？")) return;
    const updateDailyRecords = dailyRecords.filter(record => record.date !== targetDate);
    setGoal?.({
      targetText,
      targetNumber,
      dailyRecords: updateDailyRecords,
      targetType,
      targetValue,
    });
    setDate("");
    setAnswerCount("");
    setCorrectCount("");
    window.location.hash = `#goal-${slotId}`;
  }

  const handleAddRecord = () => {
    if (!date.trim() || !answerCount.trim() || !correctCount.trim()) {
      alert("すべての項目を入力してください");
      return;
    }
    const newRecord: DailyRecord = {
      date,
      answerCount,
      correctCount,
    };
    const isExistDate = dailyRecords.some(record => record.date === date);
    if (isExistDate) {
      const updatedRecords = dailyRecords.map((record) => record.date === date ? newRecord : record);
      setGoal?.({
        targetText,
        targetNumber,
        dailyRecords: updatedRecords,
        targetType,
        targetValue,
      });
    } else {
      setGoal?.({
        targetText,
        targetNumber,
        dailyRecords: [...dailyRecords, newRecord],
        targetType,
        targetValue,
      });
    }
    setAnswerCount("");
    setCorrectCount("");
    window.location.hash = `#goal-${slotId}`;
  };

  const registeredDate = createdAt ? new Date(createdAt) : new Date();
  const today = new Date();
  const diffDays = Math.floor(
    (today.setHours(0, 0, 0, 0) - registeredDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
  ) + 1;
  const allDays = Math.max(7, diffDays);

  const daysCount = period === '7days' ? 7 : period === '30days' ? 30 : allDays;
  const chartData = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateString = formatDate(d);
    const record = getRecordForDate(dateString);
    const answerCount = record ? parseInt(record.answerCount) : 0;
    const correctCount = record ? parseInt(record.correctCount) : 0;
    const rate = answerCount > 0 ? Math.round((correctCount / answerCount) * 100) : 0;
    const achieved = targetType === 'count' ? answerCount >= parseInt(targetNumber) : rate >= parseInt(targetValue);
    return {
      date: dateString.slice(5),
      answerCount,
      correctCount,
      rate,
      achieved,
    };
  }).reverse();

  const targetRateNum = parseInt(targetValue) || 60;
  const targetAnswerNum = parseInt(targetNumber) || 10;

  const alignedMaxAnswer = Math.ceil((targetAnswerNum * 100) / targetRateNum);

  const actualMaxAnswer = Math.max(...chartData.map(d => d.answerCount), 0);

  const rightAxisMax = Math.max(alignedMaxAnswer, actualMaxAnswer);

  return (
    <div>
      <div style={{ textAlign: 'left', marginBottom: '10px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', padding: 0, fontSize: '14px', textDecoration: 'underline' }}>
          ← 目標選択に戻る
        </button>
      </div>
      {/* 目標を一番上に大きく表示 */}
      <h1 style={{ fontSize: '24px', margin: '10px 0 5px' }}>{targetText}</h1>

      <div style={{ display: 'inline-flex', gap: '15px', color: '#555', fontSize: '14px', marginBottom: '24px', background: '#f0f4f8', padding: '10px 16px', borderRadius: '8px' }}>
        <span>🎯 目標回答数: <strong>{targetNumber}</strong> 問</span>
        <span>/</span>
        {targetType === 'count' ? (
          <span>🏆 目標正解数: <strong>{targetValue}</strong> 問</span>
        ) : (
          <span>📈 目標正答率: <strong>{targetValue}</strong> %</span>
        )}
      </div>

      {showRecordForm ? (
        // ----------------------------------------------------
        // 実績登録画面（フォームビュー）
        // ----------------------------------------------------
        <div style={{ padding: '20px 0' }}>
          <button onClick={() => window.location.hash = `#goal-${slotId}`} style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', padding: 0, fontSize: '14px', textDecoration: 'underline', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
            ← カレンダーに戻る
          </button>

          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', boxSizing: 'border-box', width: '100%', maxWidth: '700px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 16px 0', color: '#0066cc', textAlign: 'left', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
              {date === formatDate(new Date()) ? '今日' : date} の記録
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', textAlign: 'left', fontWeight: 'bold' }}>日付</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', textAlign: 'left', fontWeight: 'bold' }}>回答数</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="number" min="0" placeholder="0" value={answerCount} onChange={(e) => setAnswerCount(e.target.value)} style={{ width: '70px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                  <span style={{ fontSize: '14px', color: '#555' }}>問</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', textAlign: 'left', fontWeight: 'bold' }}>うち正解数</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="number" min="0" placeholder="0" value={correctCount} onChange={(e) => setCorrectCount(e.target.value)} style={{ width: '70px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                  <span style={{ fontSize: '14px', color: '#555' }}>問</span>
                </div>
              </div>
              <button onClick={handleAddRecord} style={{ padding: '9px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', height: '37px', flexShrink: 0 }}>
                保存する
              </button>
            </div>

            {date && getRecordForDate(date) && (
              <div style={{ marginTop: '20px', textAlign: 'left' }}>
                <button onClick={() => handleDeleteDailyRecord(date)} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                  この日 ({date}) の記録を削除
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ----------------------------------------------------
        // カレンダー＆グラフ画面（デフォルトビュー）
        // ----------------------------------------------------
        <>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '40px' }}>
            <div style={{ width: '100%', maxWidth: '700px', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => { setDate(formatDate(new Date())); window.location.hash = `#goal-${slotId}/record`; }} style={{ padding: '8px 16px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                ＋ 今日の記録をつける
              </button>
            </div>

            {/* 👇 凡例（Legend） */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', alignItems: 'center', margin: '0 0 16px', fontSize: '12px', color: '#444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }} />
                <span>目標回答数 達成</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }} />
                <span>目標回答数 未達</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#fafafa', border: '1px solid #f5f5f5' }} />
                <span>未実施</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#fbbf24', fontSize: '14px', textShadow: '0 0 2px rgba(251,191,36,0.5)' }}>★</span>
                <span>完全達成 (回答数＆正答率)</span>
              </div>
            </div>

            <Calendar
              formatDay={(_, date) => date.getDate().toString()}
              tileClassName={({ date }: { date: Date }) => {
                const classes = [];
                if (date.getDay() === 6) classes.push('saturday-day');
                if (date.getDay() === 0) classes.push('sunday-day');

                const dateString = formatDate(date);
                const record = getRecordForDate(dateString);
                if (record) {
                  const answerOk = isAnswerAchieved(record);
                  const accuracyOk = isAccuracyAchieved(record);
                  if (answerOk && accuracyOk) classes.push('achieved-day', 'perfect-day');
                  else classes.push(answerOk ? 'achieved-day' : 'unachieved-day');
                } else {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date < today) classes.push('missing-day');
                }

                return classes.length > 0 ? classes.join(' ') : null;
              }}
              tileContent={({ date }: { date: Date }) => {
                const dateString = formatDate(date);
                const record = getRecordForDate(dateString);
                if (record) {
                  const answerOk = isAnswerAchieved(record);
                  const accuracyOk = isAccuracyAchieved(record);
                  const isPerfect = answerOk && accuracyOk;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '2px', width: '100%', gap: '2px', padding: '0 2px', boxSizing: 'border-box' }}>
                      <div style={{ fontSize: '11px', color: '#555', display: 'flex', justifyContent: 'space-between', width: '100%', whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>
                        <span>回答:</span>
                        <span style={{ fontWeight: 'bold', marginLeft: '1px' }}>{record.answerCount}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#555', display: 'flex', justifyContent: 'space-between', width: '100%', whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>
                        <span>正解:</span>
                        <span style={{ fontWeight: 'bold', color: accuracyOk ? '#10b981' : '#ef4444', marginLeft: '1px' }}>{record.correctCount}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              onClickDay={(value: Date) => {
                const dateString = formatDate(value);
                setDate(dateString);
                const record = getRecordForDate(dateString);
                if (record) {
                  setAnswerCount(record.answerCount);
                  setCorrectCount(record.correctCount);
                } else {
                  setAnswerCount("");
                  setCorrectCount("");
                }
                window.location.hash = `#goal-${slotId}/record`;
              }}
            />
          </div>

          <h2>正答率推移</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={() => setPeriod('7days')}
              style={{ fontWeight: period === '7days' ? 'bold' : 'normal' }}
            >直近7日間</button>
            <button
              type="button"
              onClick={() => setPeriod('30days')}
              style={{ fontWeight: period === '30days' ? 'bold' : 'normal' }}
            >直近30日間</button>
            <button
              type="button"
              onClick={() => setPeriod('all')}
              style={{ fontWeight: period === 'all' ? 'bold' : 'normal' }}
            >全期間</button>
          </div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                {/* 1. 薄いグリッド線 */}
                <CartesianGrid strokeDasharray="3 3" />

                {/* 2. 横軸：chartData の中のどの項目を表示するか（dataKey） */}
                <XAxis dataKey="date" />

                {/* 左の縦軸：正答率用（0〜100%） */}
                <YAxis yAxisId="left" domain={[0, 100]} unit="%" />
                {/* 右の縦軸：回答数用（右側に配置） */}
                <YAxis yAxisId="right" orientation="right" domain={[0, rightAxisMax]} allowDecimals={false} />

                <ReferenceLine
                  yAxisId="left"
                  y={targetRateNum}
                  stroke="#2e7d32"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{
                    value: `目標: 回答数 ${targetAnswerNum}問 / 正答率 ${targetRateNum}%`,
                    position: 'insideTopLeft',
                    fill: '#2e7d32',
                    fontSize: 12,
                  }}
                />

                {/* 4. ポップアップツールチップ */}
                <Tooltip />

                {/* 回答数（棒グラフ）：右の縦軸を使用 */}
                <Bar yAxisId="right" dataKey="answerCount" fill="#82ca9d" name="回答数" />
                {/* 正答率（折れ線）：左の縦軸を使用 */}
                <Line yAxisId="left" type="monotone" dataKey="rate" stroke="#8884d8" strokeWidth={2} name="正答率" />

              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

function ManageGoalListScreen({ slot1, slot2, slot3, onSelect, onBack }: {
  slot1: GoalData | null, slot2: GoalData | null, slot3: GoalData | null,
  onSelect: (slotNum: number) => void,
  onBack: () => void
}) {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '20px', color: '#333', marginBottom: '32px' }}>編集する目標データを選択</h1>

      {slot1 === null && slot2 === null && slot3 === null && (
        <p style={{ color: '#666', marginBottom: '24px' }}>編集できる目標データがありません。</p>
      )}

      {slot1 !== null && (
        <button onClick={() => onSelect(1)} style={{ display: 'block', width: '100%', maxWidth: '500px', margin: '0 auto 16px', padding: '24px 20px', background: 'white', border: '1px solid #0066cc', borderRadius: '12px', color: '#0066cc', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
          ✏️ {slot1.targetText}
        </button>
      )}
      {slot2 !== null && (
        <button onClick={() => onSelect(2)} style={{ display: 'block', width: '100%', maxWidth: '500px', margin: '0 auto 16px', padding: '24px 20px', background: 'white', border: '1px solid #0066cc', borderRadius: '12px', color: '#0066cc', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
          ✏️ {slot2.targetText}
        </button>
      )}
      {slot3 !== null && (
        <button onClick={() => onSelect(3)} style={{ display: 'block', width: '100%', maxWidth: '500px', margin: '0 auto 16px', padding: '24px 20px', background: 'white', border: '1px solid #0066cc', borderRadius: '12px', color: '#0066cc', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
          ✏️ {slot3.targetText}
        </button>
      )}

      <button onClick={onBack} style={{ width: '100%', maxWidth: '500px', padding: '12px', background: '#f5f5f5', color: '#555', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '24px' }}>
        戻る
      </button>
    </div>
  );
}

export default function MyApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ユーザーメニュー・プロフィール編集用の状態
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // 登録情報変更用の状態
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);

  const [slot1, setSlot1] = useState<GoalData | null>(null);
  const [slot2, setSlot2] = useState<GoalData | null>(null);
  const [slot3, setSlot3] = useState<GoalData | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#goal-1')) { setSelectedSlot(1); setIsManaging(false); setEditingSlot(null); }
      else if (hash.startsWith('#goal-2')) { setSelectedSlot(2); setIsManaging(false); setEditingSlot(null); }
      else if (hash.startsWith('#goal-3')) { setSelectedSlot(3); setIsManaging(false); setEditingSlot(null); }
      else if (hash === '#manage') { setSelectedSlot(null); setIsManaging(true); setEditingSlot(null); }
      else if (hash === '#edit-1') { setSelectedSlot(null); setIsManaging(false); setEditingSlot(1); }
      else if (hash === '#edit-2') { setSelectedSlot(null); setIsManaging(false); setEditingSlot(2); }
      else if (hash === '#edit-3') { setSelectedSlot(null); setIsManaging(false); setEditingSlot(3); }
      else { setSelectedSlot(null); setIsManaging(false); setEditingSlot(null); }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // 初期化時にも実行
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 1. ユーザーの認証状態を監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setNewUsername(session.user.user_metadata?.username || '');
        setNewEmail(session.user.email || '');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setNewUsername(session.user.user_metadata?.username || '');
        setNewEmail(session.user.email || '');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // メニューが閉じられたときに編集状態をリセットする
  useEffect(() => {
    if (!isUserMenuOpen) {
      setIsEditingProfile(false);
      setIsEditingAccount(false);
      setNewUsername(user?.user_metadata?.username || '');
      setNewEmail(user?.email || '');
      setNewPassword('');
    }
  }, [isUserMenuOpen, user]);

  // 2. ログイン時に Supabase からデータ取得
  useEffect(() => {
    if (!user) {
      setSlot1(null);
      setSlot2(null);
      setSlot3(null);
      return;
    }

    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setSlot1(data.slot1);
        setSlot2(data.slot2);
        setSlot3(data.slot3);
      }
    };

    fetchGoals();
  }, [user]);

  // 3. データ変更時に Supabase へ自動保存
  const saveToSupabase = async (newSlot1: GoalData | null, newSlot2: GoalData | null, newSlot3: GoalData | null) => {
    if (!user) return;
    await supabase.from('user_goals').upsert({
      user_id: user.id,
      slot1: newSlot1,
      slot2: newSlot2,
      slot3: newSlot3,
      updated_at: new Date().toISOString(),
    });
  };

  const handleSetSlot1 = (goal: GoalData | null) => {
    setSlot1(goal);
    saveToSupabase(goal, slot2, slot3);
  };

  const handleSetSlot2 = (goal: GoalData | null) => {
    setSlot2(goal);
    saveToSupabase(slot1, goal, slot3);
  };

  const handleSetSlot3 = (goal: GoalData | null) => {
    setSlot3(goal);
    saveToSupabase(slot1, slot2, goal);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: { username: newUsername }
    });
    setIsUpdatingProfile(false);

    if (error) {
      alert("プロフィールの更新に失敗しました: " + error.message);
    } else {
      setIsEditingProfile(false);
    }
  };

  const handleUpdateAccount = async () => {
    setIsUpdatingAccount(true);
    const updates: { email?: string, password?: string } = {};
    if (newEmail && newEmail !== user?.email) updates.email = newEmail;
    if (newPassword) updates.password = newPassword;

    if (Object.keys(updates).length === 0) {
      setIsEditingAccount(false);
      setIsUpdatingAccount(false);
      return;
    }

    const { error } = await supabase.auth.updateUser(updates);
    setIsUpdatingAccount(false);

    if (error) {
      alert("登録情報の更新に失敗しました: " + error.message);
    } else {
      alert("登録情報を更新しました。" + (updates.email ? " メールアドレスを変更した場合は、新しいメールアドレス宛に確認メールが送信されることがあります。" : ""));
      setIsEditingAccount(false);
      setNewPassword(''); // パスワードフィールドをクリア
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>;
  }

  // 未ログインの場合はログイン画面を表示
  if (!user) {
    return <AuthScreen />;
  }

  const currentGoal = selectedSlot === 1 ? slot1 : selectedSlot === 2 ? slot2 : selectedSlot === 3 ? slot3 : null;
  const setCurrentGoal = selectedSlot === 1 ? handleSetSlot1 : selectedSlot === 2 ? handleSetSlot2 : selectedSlot === 3 ? handleSetSlot3 : null;

  const displayName = user.user_metadata?.username || user.email;

  return (
    <div>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative' }}>
          <div>
            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}>
              <span style={{ fontSize: '14px', color: '#333', fontWeight: 'bold' }}>👤 {displayName} ▼</span>
            </button>

            {isUserMenuOpen && (
              <>
                {/* メニュー外をクリックした時に閉じるための透明な背景 */}
                <div
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }}
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div style={{ position: 'absolute', top: '100%', left: '0', background: 'white', border: '1px solid #ccc', borderRadius: '4px', padding: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
                  {isEditingProfile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <input
                        type="text"
                        placeholder="表示名（任意）"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        style={{ padding: '4px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={handleUpdateProfile} disabled={isUpdatingProfile} style={{ fontSize: '12px', padding: '4px 8px', flex: 1 }}>
                          {isUpdatingProfile ? '保存中...' : '保存'}
                        </button>
                        <button onClick={() => {
                          setIsEditingProfile(false);
                          setNewUsername(user.user_metadata?.username || ''); // キャンセル時は元に戻す
                        }} style={{ fontSize: '12px', padding: '4px 8px', background: '#ccc', color: '#333', flex: 1 }}>
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setIsEditingProfile(true); setIsEditingAccount(false); }} style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', color: '#0066cc', fontSize: '14px' }}>
                      名前を変更する
                    </button>
                  )}

                  {isEditingAccount ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <input
                        type="email"
                        placeholder="新しいメールアドレス"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        style={{ padding: '4px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                      />
                      <input
                        type="password"
                        placeholder="新しいパスワード（変更時のみ）"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ padding: '4px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={handleUpdateAccount} disabled={isUpdatingAccount} style={{ fontSize: '12px', padding: '4px 8px', flex: 1 }}>
                          {isUpdatingAccount ? '保存中...' : '保存'}
                        </button>
                        <button onClick={() => {
                          setIsEditingAccount(false);
                          setNewEmail(user?.email || '');
                          setNewPassword('');
                        }} style={{ fontSize: '12px', padding: '4px 8px', background: '#ccc', color: '#333', flex: 1 }}>
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setIsEditingAccount(true); setIsEditingProfile(false); }} style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', color: '#0066cc', fontSize: '14px' }}>
                      登録情報を変更する
                    </button>
                  )}

                  <button onClick={() => {
                    window.location.hash = '#manage';
                    setIsUserMenuOpen(false);
                  }} style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', color: '#0066cc', fontSize: '14px' }}>
                    目標データの編集
                  </button>

                  <hr style={{ margin: '5px 0', border: '0', borderTop: '1px solid #eee', width: '100%' }} />

                  <button onClick={handleLogout} style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontSize: '14px' }}>
                    ログアウト
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {isManaging ? (
          <ManageGoalListScreen slot1={slot1} slot2={slot2} slot3={slot3} onSelect={(slotNum) => window.location.hash = `#edit-${slotNum}`} onBack={() => window.location.hash = ''} />
        ) : editingSlot !== null ? (
          <InputForm
            initialData={editingSlot === 1 ? slot1! : editingSlot === 2 ? slot2! : slot3!}
            onSave={(text, inputNumber, targetType, targetValue) => {
              const current = editingSlot === 1 ? slot1! : editingSlot === 2 ? slot2! : slot3!;
              const updated: GoalData = { ...current, targetText: text, targetNumber: inputNumber, targetType, targetValue };
              if (editingSlot === 1) handleSetSlot1(updated);
              else if (editingSlot === 2) handleSetSlot2(updated);
              else if (editingSlot === 3) handleSetSlot3(updated);
              window.location.hash = '';
            }}
            onCancel={() => window.location.hash = '#manage'}
            onDelete={() => {
              if (editingSlot === 1) handleSetSlot1(null);
              else if (editingSlot === 2) handleSetSlot2(null);
              else if (editingSlot === 3) handleSetSlot3(null);
              window.location.hash = '';
            }}
          />
        ) : selectedSlot === null ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: '0 20px' }}>
              <h1 style={{ fontSize: '22px', color: '#004499', marginBottom: '32px', fontWeight: '800' }}>目標データを選択</h1>
              <DataLabel label={slot1 !== null ? `${slot1.targetText}` : "新しい目標を登録する"} onClick={() => window.location.hash = '#goal-1'} />
              <DataLabel label={slot2 !== null ? `${slot2.targetText}` : "新しい目標を登録する"} onClick={() => window.location.hash = '#goal-2'} />
              <DataLabel label={slot3 !== null ? `${slot3.targetText}` : "新しい目標を登録する"} onClick={() => window.location.hash = '#goal-3'} />
            </div>
          </div>
        ) : currentGoal === null ? (
          <InputForm
            onSave={(text: string, inputNumber: string, targetType: GoalType, targetValue: string) => {
              setCurrentGoal?.({ targetText: text, targetNumber: inputNumber, targetType: targetType, targetValue: targetValue, dailyRecords: [] });
              window.location.hash = '';
            }}
            onCancel={() => window.location.hash = ''}
          />
        ) : currentGoal !== null ? (
          <ProgressScreen
            slotId={selectedSlot!}
            setGoal={setCurrentGoal}
            onBack={() => window.location.hash = ''}
            targetText={currentGoal.targetText}
            targetNumber={currentGoal.targetNumber}
            dailyRecords={currentGoal.dailyRecords}
            targetType={currentGoal.targetType}
            targetValue={currentGoal.targetValue}
            createdAt={user.created_at}
          />
        ) : null}
      </div>
    </div>
  );
}
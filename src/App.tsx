import './App.css';
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

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

// --- ログイン・会員登録コンポーネント ---
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
  return <button onClick={onClick}>{label}</button>;
}

function InputForm({ onSave }: { onSave: (text: string, inputNumber: string, targetType: GoalType, targetValue: string) => void }) {
  const [inputText, setInputText] = useState("");
  const [inputNumber, setInputNumber] = useState("");
  const [targetType, setTargetType] = useState<GoalType>('count');
  const [targetValue, setTargetValue] = useState("");

  const handleTypeChange = (type: GoalType) => {
    setTargetType(type);
    setTargetValue("");
  };
  const rateOptions = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);

  return (
    <div>
      <input type="text" placeholder="目標を入力してください" value={inputText} onChange={(e) => setInputText(e.target.value)} />
      <input type="number" placeholder="1日の目標回答数を入力してください" value={inputNumber} onChange={(e) => setInputNumber(e.target.value)} />
      <select value={targetType} onChange={(e) => handleTypeChange(e.target.value as GoalType)}>
        <option value="count">回答数</option>
        <option value="rate">正答率</option>
      </select>
      {targetType === 'count' ? (
        <input type="number" placeholder="目標正解数を入力してください" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
      ) : (
        <select value={targetValue} onChange={(e) => setTargetValue(e.target.value)} >
          <option value="">正答率を選択</option>
          {rateOptions.map((value) => (
            <option key={value} value={value}>{value}%</option>
          ))}
        </select>
      )}
      <button onClick={() => {
        if (!inputText.trim() || !inputNumber.trim() || !targetValue.trim()) {
          alert("すべての項目を入力してください");
          return;
        }
        onSave(inputText, inputNumber, targetType, targetValue);
      }}>目標を登録</button>
    </div>
  );
}

function ProgressScreen({ setGoal, onBack, targetText, targetNumber, dailyRecords, targetType, targetValue }: { setGoal: ((goal: GoalData | null) => void) | null, onBack: () => void, targetText: string; targetNumber: string; dailyRecords: DailyRecord[], targetType: GoalType, targetValue: string }) {
  const [date, setDate] = useState("");
  const [answerCount, setAnswerCount] = useState("");
  const [correctCount, setCorrectCount] = useState("");

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

  const handleDelete = () => {
    setGoal?.(null);
    onBack();
  };

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
    setDate("");
    setAnswerCount("");
    setCorrectCount("");
  };

  const formatDate = (d: Date) => {
    const year = String(d.getFullYear());
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getRecordForDate = (dateString: string): DailyRecord | null => {
    return dailyRecords.find((record) => record.date === dateString) || null;
  };

  return (
    <div>
      <h1>目標達成状況</h1>
      <p>目標：{targetText}</p>
      <p>目標回答数：{targetNumber}</p>
      {targetType === 'count' ? (
        <p>目標正解数：{targetValue}</p>
      ) : (
        <p>目標正解率：{targetValue}%</p>
      )}

      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <input type="number" placeholder="回答数" value={answerCount} onChange={(e) => setAnswerCount(e.target.value)} />
      <input type="number" placeholder="正解数" value={correctCount} onChange={(e) => setCorrectCount(e.target.value)} />

      <button onClick={handleAddRecord}>追加</button>

      <h2>カレンダー</h2>
      <Calendar
        tileClassName={({ date }: { date: Date }) => {
          const dateString = formatDate(date);
          const record = getRecordForDate(dateString);
          if (record && isAnswerAchieved(record)) {
            return 'achieved-day';
          }
          return null;
        }}
        tileContent={({ date }: { date: Date }) => {
          const dateString = formatDate(date);
          const record = getRecordForDate(dateString);
          if (record) {
            const accuracyOk = isAccuracyAchieved(record);
            return (
              <div>
                <p>{record.answerCount}</p>
                <p>{record.correctCount}</p>
                {accuracyOk && <span>🏵️</span>}
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
        }}
      />

      <h2>日別正答率</h2>
      <ul>
        {dailyRecords.map((record) => (
          <li key={record.date}>
            <p>日付：{record.date}</p>
            <p>回答数：{record.answerCount}</p>
            <p>正解数：{record.correctCount}</p>
            <p>正答率：{((parseInt(record.correctCount) || 0) / (parseInt(record.answerCount) || 0) * 100).toFixed(2)}%</p>
          </li>
        ))}
      </ul>

      <button onClick={onBack}>戻る</button>
      <button onClick={handleDelete}>目標を削除する</button>
    </div>
  );
}

export default function MyApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [slot1, setSlot1] = useState<GoalData | null>(null);
  const [slot2, setSlot2] = useState<GoalData | null>(null);
  const [slot3, setSlot3] = useState<GoalData | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // 1. ユーザーの認証状態を監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>;
  }

  // 未ログインの場合はログイン画面を表示
  if (!user) {
    return <AuthScreen />;
  }

  const currentGoal = selectedSlot === 1 ? slot1 : selectedSlot === 2 ? slot2 : selectedSlot === 3 ? slot3 : null;
  const setCurrentGoal = selectedSlot === 1 ? handleSetSlot1 : selectedSlot === 2 ? handleSetSlot2 : selectedSlot === 3 ? handleSetSlot3 : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: '#666' }}>👤 {user.email}</span>
        <button onClick={handleLogout} style={{ fontSize: '12px', padding: '4px 8px' }}>ログアウト</button>
      </div>

      <h1>データを選択してください</h1>
      <DataLabel label={slot1 !== null ? `${slot1.targetText}` : selectedSlot === 1 ? "新しい目標を登録する（選択中）" : "新しい目標を登録する"} onClick={() => setSelectedSlot(1)} />
      <DataLabel label={slot2 !== null ? `${slot2.targetText}` : selectedSlot === 2 ? "新しい目標を登録する（選択中）" : "新しい目標を登録する"} onClick={() => setSelectedSlot(2)} />
      <DataLabel label={slot3 !== null ? `${slot3.targetText}` : selectedSlot === 3 ? "新しい目標を登録する（選択中）" : "新しい目標を登録する"} onClick={() => setSelectedSlot(3)} />

      {selectedSlot !== null && currentGoal === null ? (
        <InputForm onSave={(text: string, inputNumber: string, targetType: GoalType, targetValue: string) => {
          setCurrentGoal?.({ targetText: text, targetNumber: inputNumber, targetType: targetType, targetValue: targetValue, dailyRecords: [] });
          setSelectedSlot(null);
        }} />
      ) : currentGoal !== null ? (
        <ProgressScreen
          setGoal={setCurrentGoal}
          onBack={() => setSelectedSlot(null)}
          targetText={currentGoal.targetText}
          targetNumber={currentGoal.targetNumber}
          dailyRecords={currentGoal.dailyRecords}
          targetType={currentGoal.targetType}
          targetValue={currentGoal.targetValue}
        />
      ) : null}
    </div>
  );
}
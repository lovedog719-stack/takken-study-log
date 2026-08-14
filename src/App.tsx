import './App.css'
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

type GoalType = 'count' | 'rate';

type GoalData = {
  targetText: string;
  targetNumber: string;
  targetType: GoalType;
  targetValue: string;

  dailyRecords: DailyRecord[];
}

type DailyRecord = {
  date: string;
  answerCount: string;
  correctCount: string;
}

function DataLabel({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}>{label}</button>
  );
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
          {rateOptions.map((value) => (
            <option key={value} value={value}>{value}%</option>
          ))}
        </select>
      )}
      <button onClick={() => {
        if (!inputText.trim() || !inputNumber.trim() || !targetValue.trim()) {
          alert("すべての項目を入力してください")
          return
        }
        onSave(inputText, inputNumber, targetType, targetValue)
      }}>目標を登録</button>
    </div>
  )
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
      const currentRate = currentCorrect / currentAnswer * 100;
      return currentRate >= targetValueNumber;
    }
  };

  const handleDelete = () => {
    setGoal?.(null);
    onBack();
  };

  const handleAddRecord = () => {
    if (!date.trim() || !answerCount.trim() || !correctCount.trim()) {
      alert("すべての項目を入力してください")
      return
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
        targetText: targetText,
        targetNumber: targetNumber,
        dailyRecords: updatedRecords,
        targetType: targetType,
        targetValue: targetValue,
      });
    } else {
      setGoal?.({
        targetText: targetText,
        targetNumber: targetNumber,
        dailyRecords: [...dailyRecords, newRecord],
        targetType: targetType,
        targetValue: targetValue,
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
  }

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

      <button onClick={() => handleAddRecord()}>追加</button>

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
          setDate(dateString)
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
  )
}

export default function MyApp() {
  const [slot1, setSlot1] = useState<GoalData | null>(() => {
    const savedSlot1 = localStorage.getItem('goal_slot1');
    return savedSlot1 ? JSON.parse(savedSlot1) : null;
  });
  const [slot2, setSlot2] = useState<GoalData | null>(() => {
    const savedSlot2 = localStorage.getItem('goal_slot2');
    return savedSlot2 ? JSON.parse(savedSlot2) : null;
  });
  const [slot3, setSlot3] = useState<GoalData | null>(() => {
    const savedSlot3 = localStorage.getItem('goal_slot3');
    return savedSlot3 ? JSON.parse(savedSlot3) : null;
  });

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('goal_slot1', JSON.stringify(slot1));
  }, [slot1]);
  useEffect(() => {
    localStorage.setItem('goal_slot2', JSON.stringify(slot2));
  }, [slot2]);
  useEffect(() => {
    localStorage.setItem('goal_slot3', JSON.stringify(slot3));
  }, [slot3]);

  const currentGoal = selectedSlot === 1 ? slot1 : selectedSlot === 2 ? slot2 : selectedSlot === 3 ? slot3 : null;
  const setCurrentGoal = selectedSlot === 1 ? setSlot1 : selectedSlot === 2 ? setSlot2 : selectedSlot === 3 ? setSlot3 : null;

  return (
    <div>
      <h1>データを選択してください</h1>
      <DataLabel label={slot1 !== null ? `${slot1.targetText}` : selectedSlot === 1 ? "新しい目標を登録する（選択中）" : "新しい目標を登録する"} onClick={() => setSelectedSlot(1)} />
      <DataLabel label={slot2 !== null ? `${slot2.targetText}` : selectedSlot === 2 ? "新しい目標を登録する（選択中）" : "新しい目標を登録する"} onClick={() => setSelectedSlot(2)} />
      <DataLabel label={slot3 !== null ? `${slot3.targetText}` : selectedSlot === 3 ? "新しい目標を登録する（選択中）" : "新しい目標を登録する"} onClick={() => setSelectedSlot(3)} />

      {selectedSlot !== null && currentGoal === null ?
        <InputForm onSave={(text: string, inputNumber: string, targetType: GoalType, targetValue: string) => {
          setCurrentGoal?.({ targetText: text, targetNumber: inputNumber, targetType: targetType, targetValue: targetValue, dailyRecords: [] });
          setSelectedSlot(null);
        }} />
        : currentGoal !== null ?
          <ProgressScreen setGoal={setCurrentGoal} onBack={() => setSelectedSlot(null)} targetText={currentGoal.targetText} targetNumber={currentGoal.targetNumber} dailyRecords={currentGoal.dailyRecords} targetType={currentGoal.targetType} targetValue={currentGoal.targetValue} />
          : null
      }
    </div>
  );
}

'use client';

import { useState } from 'react';
import type {
  VehicleType,
  FourWDDifficulty,
  BikeDifficulty,
  DifficultyDetail,
  VEHICLE_TYPE_LABELS,
  FOURWD_DIFFICULTY_LABELS,
  BIKE_DIFFICULTY_LABELS,
} from '@/types/road';

// ラベルのインポート
import {
  VEHICLE_TYPE_LABELS as VEHICLE_LABELS,
  FOURWD_DIFFICULTY_LABELS as FOURWD_LABELS,
  BIKE_DIFFICULTY_LABELS as BIKE_LABELS,
} from '@/types/road';

interface DifficultySelectorProps {
  selectedVehicles: VehicleType[];
  selectedDifficulties: DifficultyDetail[];
  isPassable: boolean;
  onVehiclesChange: (vehicles: VehicleType[]) => void;
  onDifficultiesChange: (difficulties: DifficultyDetail[]) => void;
  onPassableChange: (passable: boolean) => void;
}

// 四駆の難易度オプション
const FOURWD_DIFFICULTIES: FourWDDifficulty[] = [
  'FLAT',
  'DIRT_2WD_OK',
  'DIRT_4WD_REQUIRED',
  'MUD_TERRAIN_REQUIRED',
  'DIFFERENTIAL_LOCK_REQUIRED',
  'ROCK_SECTION',
];

// バイクの難易度オプション
const BIKE_DIFFICULTIES: BikeDifficulty[] = [
  'FLAT_EASY',
  'DIRT_NORMAL',
  'SANDY_MUDDY',
  'TECHNICAL',
];

export default function DifficultySelector({
  selectedVehicles,
  selectedDifficulties,
  isPassable,
  onVehiclesChange,
  onDifficultiesChange,
  onPassableChange,
}: DifficultySelectorProps) {
  // 車種カテゴリの選択/解除
  const handleVehicleToggle = (vehicle: VehicleType) => {
    if (vehicle === 'ALL') {
      // ALLを選択した場合、他を全て解除
      onVehiclesChange(['ALL']);
      // 難易度もリセット
      onDifficultiesChange([]);
    } else {
      // ALL以外を選択
      const newVehicles = selectedVehicles.includes(vehicle)
        ? selectedVehicles.filter((v) => v !== vehicle)
        : [...selectedVehicles.filter((v) => v !== 'ALL'), vehicle];

      onVehiclesChange(newVehicles);

      // 選択解除した車種の難易度を削除
      if (!selectedVehicles.includes(vehicle)) {
        // 追加の場合は何もしない
      } else {
        // 削除の場合、その車種の難易度を削除
        const relevantDifficulties: readonly DifficultyDetail[] =
          vehicle === '4WD' ? FOURWD_DIFFICULTIES : BIKE_DIFFICULTIES;
        const newDifficulties = selectedDifficulties.filter(
          (d) => !(relevantDifficulties as readonly DifficultyDetail[]).includes(d)
        );
        onDifficultiesChange(newDifficulties);
      }
    }
  };

  // 難易度の選択/解除
  const handleDifficultyToggle = (difficulty: DifficultyDetail) => {
    const newDifficulties = selectedDifficulties.includes(difficulty)
      ? selectedDifficulties.filter((d) => d !== difficulty)
      : [...selectedDifficulties, difficulty];

    onDifficultiesChange(newDifficulties);
  };

  // 表示する難易度オプションを判定
  const show4WDOptions = selectedVehicles.includes('4WD');
  const showBikeOptions = selectedVehicles.includes('BIKE');
  const showAllWarning = selectedVehicles.includes('ALL');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 通行可否 */}
      <div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
          }}
        >
          <input
            type="checkbox"
            checked={!isPassable}
            onChange={(e) => onPassableChange(!e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ color: !isPassable ? '#ef4444' : '#333' }}>
            この林道は通行不可
          </span>
        </label>
        {!isPassable && (
          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', marginLeft: '1.75rem' }}>
            通行止めの理由を下の「詳細」欄に記入してください
          </p>
        )}
      </div>

      {/* 車種カテゴリ選択 */}
      {isPassable && (
        <>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontWeight: '600',
                color: '#333',
                fontSize: '1rem',
              }}
            >
              通行可能な車種 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
              通行可能な車種カテゴリを選択してください（複数選択可）
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {(['ALL', '4WD', 'BIKE'] as VehicleType[]).map((vehicle) => {
                const isSelected = selectedVehicles.includes(vehicle);
                return (
                  <button
                    key={vehicle}
                    type="button"
                    onClick={() => handleVehicleToggle(vehicle)}
                    style={{
                      padding: '0.75rem 1.25rem',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: isSelected ? 'white' : '#2d5016',
                      backgroundColor: isSelected ? '#2d5016' : 'white',
                      border: `2px solid #2d5016`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {VEHICLE_LABELS[vehicle]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ALL選択時の警告 */}
          {showAllWarning && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '6px',
                fontSize: '0.9rem',
                color: '#92400e',
              }}
            >
              「すべての車両」を選択しています。詳細な難易度は選択できません。
            </div>
          )}

          {/* 四駆向け難易度選択 */}
          {show4WDOptions && (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '1rem',
                }}
              >
                四駆（4WD）の難易度 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
                該当する難易度をすべて選択してください（複数選択可）
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {FOURWD_DIFFICULTIES.map((difficulty) => {
                  const isSelected = selectedDifficulties.includes(difficulty);
                  const labels = FOURWD_LABELS[difficulty];
                  return (
                    <label
                      key={difficulty}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        backgroundColor: isSelected ? '#f0fdf4' : 'white',
                        border: `2px solid ${isSelected ? '#22c55e' : '#e5e7eb'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleDifficultyToggle(difficulty)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#333' }}>
                          {labels.short}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          {labels.full}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* バイク向け難易度選択 */}
          {showBikeOptions && (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '1rem',
                }}
              >
                バイク（二輪）の難易度 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
                該当する難易度をすべて選択してください（複数選択可）
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {BIKE_DIFFICULTIES.map((difficulty) => {
                  const isSelected = selectedDifficulties.includes(difficulty);
                  const labels = BIKE_LABELS[difficulty];
                  return (
                    <label
                      key={difficulty}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        backgroundColor: isSelected ? '#f0fdf4' : 'white',
                        border: `2px solid ${isSelected ? '#22c55e' : '#e5e7eb'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleDifficultyToggle(difficulty)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#333' }}>
                          {labels.short}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          {labels.full}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

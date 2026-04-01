import React from 'react';
import {SegmentedButtons} from 'react-native-paper';
import {BillType} from '@/types/bill';
import {billTypeOptions} from '@/utils/constants';

interface Props {
  value: BillType;
  onChange: (value: BillType) => void;
}

export default function BillTypeSwitch({value, onChange}: Props): React.JSX.Element {
  return (
    <SegmentedButtons
      value={value}
      onValueChange={next => onChange(next as BillType)}
      buttons={billTypeOptions.map(item => ({
        label: item.label,
        value: item.value,
      }))}
    />
  );
}

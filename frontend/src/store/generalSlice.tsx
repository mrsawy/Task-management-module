import { createSlice, type PayloadAction } from "@reduxjs/toolkit";


const initialState = {
    generalIsLoading: false
}


const generalSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setGeneralIsLoading: (state, action: PayloadAction<boolean>) => {
            state.generalIsLoading = action.payload;
        },
        
    },
});

export const { setGeneralIsLoading } = generalSlice.actions;
export default generalSlice.reducer;
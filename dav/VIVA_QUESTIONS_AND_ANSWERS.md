# Viva Questions and Answers: Student Academic Performance Analysis

### 1. What is the primary objective of this project?
**Answer:** To analyze factors influencing student examination outcomes using Python and Excel through data cleaning, exploratory statistics, correlation analysis, visualization, and predictive Linear Regression modeling.

### 2. Why did you choose Google Colab for developing this project?
**Answer:** Google Colab runs entirely in the cloud through any web browser, requires zero local Python installation, provides free CPU/GPU resources, pre-installs major scientific libraries, and facilitates seamless sharing and presentation.

### 3. What is the difference between Pandas and NumPy in your project?
**Answer:** NumPy provides high-performance multi-dimensional arrays and vectorized numerical calculations, while Pandas builds on top of NumPy to provide tabular `DataFrame` structures with labeled rows, columns, and data wrangling tools.

### 4. What intentional data quality issues did you inject into the raw dataset?
**Answer:** We deliberately injected 6 duplicate rows, 11 missing values (`NaN`) across several columns, and 4 out-of-bounds invalid values (e.g., attendance of 145%, negative study hours, and negative internal marks) to demonstrate practical data cleaning.

### 5. Why is removing duplicate rows important in data preprocessing?
**Answer:** Duplicate rows distort statistical calculations (e.g., falsely inflating sample counts and skewing means) and cause data leakage if the same instance appears in both training and test sets.

### 6. Why did you use median imputation instead of mean imputation for missing values?
**Answer:** The mean is sensitive to extreme values and skewness, which can pull imputed numbers away from typical student behavior. The median represents the true 50th percentile (central value) and is robust against outliers.

### 7. How does the Interquartile Range (IQR) method detect outliers?
**Answer:** IQR is the spread of the middle 50% of the data: $IQR = Q_3 - Q_1$. Lower bound is $Q_1 - 1.5 \times IQR$ and upper bound is $Q_3 + 1.5 \times IQR$. Any value falling outside these bounds is mathematically flagged as an outlier.

### 8. Why didn't you automatically delete all detected outliers?
**Answer:** In academic records, a student studying 9.2 hours or scoring exceptionally high marks is a genuine high-achieving student, not a measurement defect. Automatically deleting genuine records introduces severe survivorship and sample bias.

### 9. What is the difference between Mean, Median, and Mode?
**Answer:** 
- **Mean:** The arithmetic average of all values ($\sum X / N$).
- **Median:** The middle value when records are sorted in ascending order (50th percentile).
- **Mode:** The most frequently occurring score in the dataset.

### 10. What do Standard Deviation and Variance measure?
**Answer:** Variance measures the average squared deviation of data points from the mean. Standard Deviation is the square root of variance, measuring the typical spread of scores around the mean in the original units of marks.

### 11. What are the four performance categories defined in this project?
**Answer:** 
1. **Excellent:** 85.00 – 100.00 marks
2. **Good:** 70.00 – 84.99 marks
3. **Average:** 50.00 – 69.99 marks
4. **Needs Improvement:** Below 50.00 marks

### 12. What were the percentage breakdowns for these categories in your dataset?
**Answer:** 
- Needs Improvement (<50): **2.81%** (9 students)
- Average (50–69.99): **49.06%** (157 students)
- Good (70–84.99): **42.19%** (135 students)
- Excellent (85–100): **5.94%** (19 students)

### 13. What is Pearson's Correlation Coefficient ($r$)?
**Answer:** A normalized statistical metric ranging from $-1.0$ to $+1.0$ quantifying the strength and direction of linear association between two variables. $+1$ indicates perfect positive correlation, $0$ indicates no linear relationship, and $-1$ indicates perfect inverse correlation.

### 14. Which feature had the strongest correlation with Final Marks in your project?
**Answer:** **Assignment Score** had the highest correlation ($r = 0.7607$), followed closely by **Internal Marks** ($r = 0.7441$) and **Daily Study Hours** ($r = 0.6332$).

### 15. Explain the phrase "Correlation does not imply Causation."
**Answer:** Just because two variables move together does not mean one directly causes the other; a third lurking variable (e.g., student discipline, teacher quality, or motivation) might be influencing both simultaneously.

### 16. What is the purpose of Seaborn in data visualization?
**Answer:** Seaborn is a high-level statistical data visualization library built on top of Matplotlib that provides attractive default themes, statistical aggregations (like KDE curves and regression lines), and color palettes with minimal boilerplate code.

### 17. What does the KDE curve in your histogram represent?
**Answer:** Kernel Density Estimation (KDE) is a smoothed, continuous estimate of the probability density function of final examination marks, helping visualize distribution skewness and multimodality.

### 18. What is Linear Regression and what equation does it fit?
**Answer:** Linear Regression is a supervised machine learning algorithm that models the linear relationship between a dependent target variable ($Y$) and one or more independent predictor features ($X_1, X_2, \dots, X_p$):
$$Y = \beta_0 + \beta_1 X_1 + \beta_2 X_2 + \dots + \beta_p X_p + \epsilon$$

### 19. Why did you perform an 80/20 Train-Test split?
**Answer:** Splitting prevents data leakage and overfitting. The model learns patterns solely on 80% training data, and its predictive generalization is honestly tested on 20% unseen test data.

### 20. Why must `Student_ID` be excluded from regression features?
**Answer:** `Student_ID` is an arbitrary administrative identifier. Including it causes spurious correlation and data leakage where the model memorizes IDs instead of learning academic patterns.

### 21. What is Mean Absolute Error (MAE) and what was your result?
**Answer:** MAE is the average magnitude of absolute errors between actual and predicted marks:
$$\text{MAE} = \frac{1}{n} \sum |y_i - \hat{y}_i|$$
In our project, MAE was **3.1291 marks**, meaning predictions deviate by only ~3.1 marks on average.

### 22. What is Root Mean Squared Error (RMSE) and how does it differ from MAE?
**Answer:** RMSE is the square root of the mean squared errors:
$$\text{RMSE} = \sqrt{\frac{1}{n} \sum (y_i - \hat{y}_i)^2}$$
RMSE penalizes larger outliers more heavily than MAE. Our project obtained an RMSE of **4.3154 marks**.

### 23. What is $R^2$ (Coefficient of Determination) and what was your model's score?
**Answer:** $R^2$ measures the proportion of variance in the target variable explained by the regression model:
$$R^2 = 1 - \frac{SS_{\text{res}}}{SS_{\text{tot}}}$$
Our model achieved an $R^2$ of **0.8183 (81.83%)** on unseen test data, indicating very strong predictive ability.

### 24. What does the coefficient for `Study_Hours` ($+1.7097$) mean practically?
**Answer:** Holding all other factors constant, every additional daily hour of self-study is associated with an expected increase of approximately **1.71 marks** in the final examination.

### 25. What is the role of OpenPyXL in this project?
**Answer:** `openpyxl` is a specialized Python library used to create, read, and write native `.xlsx` Excel files, apply cell fonts, header colors, borders, number formatting, and inject dynamic Excel formulas like `=AVERAGE()` and `=COUNT()`.

### 26. Why is an Excel workbook valuable in a data science project?
**Answer:** Excel allows non-technical stakeholders (such as college principals, professors, and academic advisors) to interact with, filter, sort, and inspect findings without needing Python or coding environments.

### 27. What are the key limitations of your model?
**Answer:** The dataset is synthetic, assumes strictly linear relationships, and does not capture qualitative factors like mental health, teacher pedagogy, family background, or exam-day illness.

### 28. How can this project be extended in the future?
**Answer:** By incorporating non-linear ensemble models (Random Forest, XGBoost), connecting to real university ERP databases, developing an interactive Streamlit web dashboard, and implementing early-warning email alerts for at-risk students.

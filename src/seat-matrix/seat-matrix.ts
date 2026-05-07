import { ChangeDetectorRef, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { SeatMatrixService } from './seat-matrix-service';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-seat-matrix',
  imports: [CommonModule, ReactiveFormsModule, NgClass, NgSelectModule],
  templateUrl: './seat-matrix.html',
  styleUrl: './seat-matrix.css',
})
export class SeatMatrix implements OnInit, OnDestroy {
  seatType = signal('noncentral');
  isView = signal(false);
  filterForm!: FormGroup;
  seatMatrixForm!: FormGroup;
  savedData: any = null; // Used to show generated flat data in HTML

  // Dropdown data arrays
  streams: any[] = [];
  instituteTypes: any[] = [];
  institutes: any[] = [];
  courses: any[] = [];
  counsellings: any[] = [];

  categories: any[] = [];
  requiredCategories: any[] = [];

  streamSubscription!: Subscription;
  instituteTypeSubscription!: Subscription;
  instituteSubscription!: Subscription;
  courseSubscription!: Subscription;
  courseTypeSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private seatMatrixService: SeatMatrixService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initFilterForm();
    this.initSeatMatrixForm();
    this.loadDropdownData();
  }

  ngOnDestroy(): void {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
    }

    if (this.instituteTypeSubscription) {
      this.instituteTypeSubscription.unsubscribe();
    }
    if (this.instituteSubscription) {
      this.instituteSubscription.unsubscribe();
    }
    if (this.courseSubscription) {
      this.courseSubscription.unsubscribe();
    }
    if (this.courseTypeSubscription) {
      this.courseTypeSubscription.unsubscribe();
    }
  }

  loadDropdownData(): void {
    this.seatMatrixService.getStreams().subscribe(data => this.streams = data);
    this.seatMatrixService.getInstituteTypes().subscribe(data => this.instituteTypes = data);
    // this.getCourses();
  }

  initFilterForm(): void {
    this.filterForm = this.fb.group({
      stream: [null, [Validators.required]],
      instituteType: [null, [Validators.required]],
      institute: [null, [Validators.required]],
      course: [null, [Validators.required]],
      courseType: ['', [Validators.required]],
      counselling: ['1', [Validators.required]]
    });
    if (!this.streamSubscription) {
      this.streamSubscription = this.filterForm.get('stream')?.valueChanges.subscribe(res => {
        this.resetSeatMatrixData();
      })!;
    }

    if (!this.instituteTypeSubscription) {
      this.instituteTypeSubscription = this.filterForm.get('instituteType')?.valueChanges.subscribe(res => {
        this.resetSeatMatrixData();
      })!;
    }
    if (!this.instituteSubscription) {
      this.instituteSubscription = this.filterForm.get('institute')?.valueChanges.subscribe(res => {
        this.resetSeatMatrixData();
      })!;
    }
    if (!this.courseSubscription) {
      this.courseSubscription = this.filterForm.get('course')?.valueChanges.subscribe(res => {
        this.resetSeatMatrixData();
      })!;
    }
    if (!this.courseTypeSubscription) {
      this.courseTypeSubscription = this.filterForm.get('courseType')?.valueChanges.subscribe(res => {
        this.resetSeatMatrixData();
      })!;
    }
  }

  initSeatMatrixForm(): void {
    this.seatMatrixForm = this.fb.group({
      seatCategories: this.fb.array([])
    });
  }

  get seatCategories(): FormArray {
    return this.seatMatrixForm.get('seatCategories') as FormArray;
  }

  createCategoryGroup(category: any): FormGroup {
    let fb = this.fb.group({
      categoryID: [category.categoryID],
      categoryName: [category.categoryName],
      stateNonRural: [0],
      stateRural: [0],
      otherNonRural: [0],
      otherRural: [0],
      ci_ct_na_ur: [0],
      ci_ct_pb_ur: [0],
      ci_ct_ch_ur: [0],
      ci_ct_hr_ur: [0],
      ci_ct_hp_ur: [0],
      ci_ct_jk_ur: [0],
      total: [0]
    });
    if (this.filterForm.value.course.feeWStatus == 'Y') {
      fb.get('stateRural')?.disable();
      fb.get('otherNonRural')?.disable();
      fb.get('otherRural')?.disable();
      fb.get('ci_ct_na_ur')?.disable();
      fb.get('ci_ct_ch_ur')?.disable();
      fb.get('ci_ct_hr_ur')?.disable();
      fb.get('ci_ct_hp_ur')?.disable();
      fb.get('ci_ct_jk_ur')?.disable();
    }
    else {
      if (['01'].includes(this.filterForm.value.institute.instituteType)) {
        if(!['904717', '904773'].includes(this.filterForm.value.institute.instituteID))
        {
          fb.get('otherRural')?.disable();
          fb.get('stateRural')?.disable();
        }   

        if (!['OP', '01', 'SC', 'ST', 'BC'].includes(category.categoryID)) {
          fb.get('otherNonRural')?.disable();
          fb.get('otherRural')?.disable();
        }
        else {
          fb.get('otherNonRural')?.enable();
        }
      }
      else if (['02'].includes(this.filterForm.value.institute.instituteType)) {
        if(!['904717', '904773'].includes(this.filterForm.value.institute.instituteID))
        {
          fb.get('otherRural')?.disable();
          fb.get('stateRural')?.disable();
        } 

        if (['OP', 'SC', '13', '04'].includes(category.categoryID)) {
          fb.get('stateNonRural')?.enable();
        }
        else {
          fb.get('stateNonRural')?.disable();
        }
      }
      else if (['03', '04'].includes(this.filterForm.value.institute.instituteType)) {
        if (['01'].includes(category.categoryID)) {
          fb.get('ci_ct_na_ur')?.enable(),
            fb.get('ci_ct_pb_ur')?.disable(),
            fb.get('ci_ct_ch_ur')?.disable(),
            fb.get('ci_ct_hr_ur')?.disable(),
            fb.get('ci_ct_hp_ur')?.disable(),
            fb.get('ci_ct_jk_ur')?.disable()
        }
      }
    }
    return fb;
  }

  populateFormFromData(flatData: any[]): void {
    this.seatCategories.controls.forEach(control => {
      control.patchValue({
        stateNonRural: 0, stateRural: 0,
        otherNonRural: 0, otherRural: 0,
        total: 0,
        ci_ct_na_ur: 0,
        ci_ct_pb_ur: 0,
        ci_ct_ch_ur: 0,
        ci_ct_hr_ur: 0,
        ci_ct_hp_ur: 0,
        ci_ct_jk_ur: 0
      });
    });

    // 3. Group the incoming data into the form controls
    flatData.forEach(entry => {
      const categoryControl = this.seatCategories.controls.find(
        c => c.get('categoryID')?.value === entry.categoryID
      );

      if (categoryControl) {
        let currentVals = categoryControl.value;
        if (['PB', 'OP'].includes(entry.quotaID)) {
          this.seatType.set('noncentral');
          if (entry.quotaID === 'PB' && entry.groupID === 'UR') {
            categoryControl.patchValue({
              stateNonRural: (currentVals.stateNonRural ?? 0) + (entry.tseat ?? 0),
              total: (currentVals.total ?? 0) + (currentVals.stateNonRural ?? 0)
            });
          } else if (entry.quotaID === 'PB' && entry.groupID === 'RU') {
            categoryControl.patchValue({
              stateRural: (currentVals.stateRural ?? 0) + (entry.tseat ?? 0),
              total: (currentVals.total ?? 0) + (currentVals.stateRural ?? 0)
            });
          } else if (entry.quotaID === 'OP' && entry.groupID === 'UR') {
            categoryControl.patchValue({
              otherNonRural: (currentVals.otherNonRural ?? 0) + (entry.tseat ?? 0),
              total: (currentVals.total ?? 0) + (currentVals.otherNonRural ?? 0)
            });
          } else if (entry.quotaID === 'OP' && entry.groupID === 'RU') {
            categoryControl.patchValue({
              otherRural: (currentVals.otherRural ?? 0) + (entry.tseat ?? 0),
              total: (currentVals.total ?? 0) + (currentVals.otherRural ?? 0)
            });
          }
        }
        else if (['UT', 'OU'].includes(entry.quotaID)) {
          this.seatType.set('noncentral');
          if (entry.quotaID === 'UT' && entry.groupID === 'UR') {
            categoryControl.patchValue({
              stateNonRural: (currentVals.stateNonRural ?? 0) + (entry.tseat ?? 0),
              total: (currentVals.total ?? 0) + (currentVals.stateNonRural ?? 0)
            });
          } else if (entry.quotaID === 'UT' && entry.groupID === 'RU') {
            categoryControl.patchValue({
              stateRural: (currentVals.stateRural ?? 0) + (entry.tseat ?? 0),
              total: (currentVals.total ?? 0) + (currentVals.stateRural ?? 0)
            });
          } else if (entry.quotaID === 'OU' && entry.groupID === 'UR') {
            categoryControl.patchValue({
              otherNonRural: (currentVals.otherNonRural ?? 0) + (entry.tseat ?? 0),
              total: (currentVals.total ?? 0) + (currentVals.otherNonRural ?? 0)
            });
          } else if (entry.quotaID === 'OU' && entry.groupID === 'RU') {
            categoryControl.patchValue({
              otherRural: (currentVals.otherRural ?? 0) + (entry.tseat ?? 0),
              total: (currentVals.total ?? 0) + (currentVals.otherRural ?? 0)
            });
          }
        }
        else if (['CT', 'CI'].includes(entry.quotaID)) {
          this.seatType.set('central');
          if (entry.groupID === 'UR') {
            switch (entry.seatType) {
              case ('NA'): {
                categoryControl.patchValue({
                  ci_ct_na_ur: (currentVals.ci_ct_na_ur ?? 0) + (entry.tseat ?? 0),
                  total: (currentVals.total ?? 0) + (currentVals.ci_ct_na_ur ?? 0)
                });
                break;
              }
              case ('PB'): {
                categoryControl.patchValue({
                  ci_ct_pb_ur: (currentVals.ci_ct_pb_ur ?? 0) + (entry.tseat ?? 0),
                  total: (currentVals.total ?? 0) + (currentVals.ci_ct_pb_ur ?? 0)
                });
                break;
              }
              case ('CH'): {
                categoryControl.patchValue({
                  ci_ct_ch_ur: (currentVals.ci_ct_ch_ur ?? 0) + (entry.tseat ?? 0),
                  total: (currentVals.total ?? 0) + (currentVals.ci_ct_ch_ur ?? 0)
                });
                break;
              }
              case ('HR'): {
                categoryControl.patchValue({
                  ci_ct_hr_ur: (currentVals.ci_ct_hr_ur ?? 0) + (entry.tseat ?? 0),
                  total: (currentVals.total ?? 0) + (currentVals.ci_ct_hr_ur ?? 0)
                });
                break;
              }
              case ('HP'): {
                categoryControl.patchValue({
                  ci_ct_hp_ur: (currentVals.ci_ct_hp_ur ?? 0) + (entry.tseat ?? 0),
                  total: (currentVals.total ?? 0) + (currentVals.ci_ct_hp_ur ?? 0)
                });
                break;
              }
              case ('JK'): {
                categoryControl.patchValue({
                  ci_ct_jk_ur: (currentVals.ci_ct_jk_ur ?? 0) + (entry.tseat ?? 0),
                  total: (currentVals.total ?? 0) + (currentVals.ci_ct_jk_ur ?? 0)
                });
                break;
              }
              default: break;
            }

          } else if (entry.groupID === 'RU') {
            switch (entry.seatType) {
              case ('NA'): {
                categoryControl.patchValue({
                  ci_ct_na_ru: (currentVals.ci_ct_na_ru ?? 0) + (entry.tseat ?? 0),
                  total: (currentVals.total ?? 0) + (currentVals.ci_ct_na_ru ?? 0)
                });
                break;
              }
              case ('PB'): {
                categoryControl.patchValue({
                  ci_ct_pb_ru: (currentVals.ci_ct_pb_ru ?? 0) + (entry.tseat ?? 0),
                  total: (currentVals.total ?? 0) + (currentVals.ci_ct_pb_ru ?? 0)
                });
                break;
              }
              case ('CH'): {
                categoryControl.patchValue({
                  ci_ct_ch_ru: (currentVals.ci_ct_ch_ru ?? 0) + (entry.tseat ?? 0),
                  total: (currentVals.total ?? 0) + (currentVals.ci_ct_ch_ru ?? 0)
                });
                break;
              }
              case ('HR'): {
                categoryControl.patchValue({
                  ci_ct_hr_ru: (currentVals.ci_ct_hr_ru ?? 0) + (entry.tseat ?? 0),
                  total: (currentVals.total ?? 0) + (currentVals.ci_ct_hr_ru ?? 0)
                });
                break;
              }
              case ('HP'): {
                categoryControl.patchValue({
                  ci_ct_hp_ru: (currentVals.ci_ct_hp_ru ?? 0) + (entry.tseat ?? 0),
                  total: (currentVals.total ?? 0) + (currentVals.ci_ct_hp_ru ?? 0)
                });
                break;
              }
              case ('JK'): {
                categoryControl.patchValue({
                  ci_ct_jk_ru: (currentVals.ci_ct_jk_ru ?? 0) + (entry.tseat ?? 0),
                  total: (currentVals.total ?? 0) + (currentVals.ci_ct_jk_ru ?? 0)
                });
                break;
              }
              default: break;
            }
          }
        }
      }
    });
  }

  // 2. Generate the flat data structure to send to backend when saving
  getFlatDataFromForm(): any[] {
    const flatData: any[] = [];
    const formVals = this.filterForm.value; // to get common info like institute, etc.

    this.seatCategories.controls.forEach(control => {
      const val = control.value;
      const catCode = val.categoryID;
      const catName = val.categoryName;
      // Create separate entries for each grid intersection
      if (this.filterForm.value.institute.instituteType == '01') {
        if (val.otherNonRural != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'OP', 'UR', (val.otherNonRural ?? 0), 'NA'));        
        if (val.stateNonRural != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'PB', 'UR', (val.stateNonRural ?? 0), 'NA'));        

        if(['904717', '904773'].includes(formVals.institute.instituteID))
        {
          if (val.stateRural != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'PB', 'RU', (val.stateRural ?? 0), 'NA'));
          if (val.otherRural != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'OP', 'RU', (val.otherRural ?? 0), 'NA'));
        }
      }
      else if (this.filterForm.value.institute.instituteType == '02') {
        if (val.stateNonRural != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'UT', 'UR', (val.stateNonRural ?? 0), 'NA'));
        // if (val.stateRural > 0) flatData.push(this.createFlatEntry(catCode, catName, 'UT', 'RU', val.stateRural, 'NA'));
        if (val.otherNonRural != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'OU', 'UR', (val.otherNonRural ?? 0), 'NA'));
        // if (val.otherRural > 0) flatData.push(this.createFlatEntry(catCode, catName, 'OU', 'RU', val.otherRural, 'NA'));
      }
      else if (this.filterForm.value.institute.instituteType == '03') {
        if (val.ci_ct_na_ur != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'CT', 'UR', (val.ci_ct_na_ur ?? 0), 'NA'));
        if (val.ci_ct_pb_ur != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'CT', 'UR', (val.ci_ct_pb_ur ?? 0), 'PB'));
        if (val.ci_ct_ch_ur != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'CT', 'UR', (val.ci_ct_ch_ur ?? 0), 'CH'));
        if (val.ci_ct_hr_ur != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'CT', 'UR', (val.ci_ct_hr_ur ?? 0), 'HR'));
        if (val.ci_ct_hp_ur != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'CT', 'UR', (val.ci_ct_hp_ur ?? 0), 'HP'));
        if (val.ci_ct_jk_ur != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'CT', 'UR', (val.ci_ct_jk_ur ?? 0), 'JK'));
      }
      else if (this.filterForm.value.institute.instituteType == '04') {
        if (val.ci_ct_na_ur != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'CI', 'UR', (val.ci_ct_na_ur ?? 0), 'NA'));
        if (val.ci_ct_pb_ur != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'CI', 'UR', (val.ci_ct_pb_ur ?? 0), 'PB'));
        if (val.ci_ct_ch_ur != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'CI', 'UR', (val.ci_ct_ch_ur ?? 0), 'CH'));
        if (val.ci_ct_hr_ur != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'CI', 'UR', (val.ci_ct_hr_ur ?? 0), 'HR'));
        if (val.ci_ct_hp_ur != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'CI', 'UR', (val.ci_ct_hp_ur ?? 0), 'HP'));
        if (val.ci_ct_jk_ur != undefined) flatData.push(this.createFlatEntry(catCode, catName, 'CI', 'UR', (val.ci_ct_jk_ur ?? 0), 'JK'));
      }
    });

    return flatData;
  }

  private createFlatEntry(categoryId: string, categoryName: string, quotaId: string, groupId: string, tSeat: number, seatType: string) {
    return {
      categoryID: categoryId,
      categoryName: categoryName,
      groupID: groupId,
      seatType: seatType,
      quotaID: quotaId,
      // genderID: "B", // Adding default as per sample API
      priority: 1,   // Default priority
      tseat: tSeat,
      vseat: 0,
      // You can also add common parameters like streamId, instituteId from filterForm here if needed
    };
  }

  // -------------------------

  onView(): void {
    if (this.filterForm.valid) {
      const filters = this.filterForm.value;
      let req = {
        roundNo: filters.counselling,
        instituteID: filters.institute.instituteID,
        courseID: filters.course.courseID,
        streamID: filters.stream

      }
      // Call API using service
      this.seatMatrixService.getSeatMatrixData(req).subscribe({
        next: (response: any[]) => {
          if (response && response.length > 0) {
            let reqJson = {
              typeID: filters.institute.instituteType,
              courseID: filters.course.courseID
            };
            this.seatMatrixService.getCategories(reqJson).subscribe(data => {
              this.categories = [...data];
              this.seatMatrixForm.setControl('seatCategories', this.fb.array([]));
              this.categories.forEach(category => {
                this.seatCategories.push(this.createCategoryGroup(category));
              });
              
              setTimeout(() => {
                this.isView.set(true);
                this.populateFormFromData(response);
                this.cdr.detectChanges();
              }, 100);
            });
          } else {
            this.resetSeatMatrixData();
          }
        },
        error: (err) => {
          console.error('API Error', err);
        }
      });
    }
    else {
      alert('Please fill all required inputs!');
    }
  }

  resetSeatMatrixData() {
    this.categories = [];    
    this.seatMatrixForm.setControl('seatCategories', this.fb.array([]));
  }

  onCancel(): void {
    this.isView.set(false);
    this.resetSeatMatrixData();
    this.institutes = [];
    this.courses = [];
    this.filterForm.reset({
      stream: null,
      instituteType: null,
      institute: null,
      course: null,
      courseType: '',
      counselling: '1'
    });
    this.cdr.detectChanges();
  }

  onSubmitSeatMatrix(): void {
    const dataToSave = this.getFlatDataFromForm();
    this.savedData = dataToSave; // Assign it to variable to display in HTML
    const filters = this.filterForm.value;
    const req = {
      streamID: filters.stream,
      instituteID: filters.institute.instituteID,
      courseID: filters.course.courseID,
      roundNo: filters.counselling,
      seatMatrixData: dataToSave
    }
    // Call API using service
    this.seatMatrixService.saveSeatMatrixData(req).subscribe({
      next: (res) => {
        if (res && res.response == 1) {
          alert('Data saved successfully!');
        }
        else {
          alert(res.message ?? 'Failed to submit!');
        }
      },
      error: (err) => {
        console.error('Save failed', err);
        alert('Something went wrong');
      }
    });
  }
  getInstitute() {
    const typeId = this.filterForm.get('instituteType')?.value;
    this.institutes = [];
    this.filterForm.get('institute')?.setValue(null);
    let req = {
      typeId: typeId
    }
    this.seatMatrixService.getInstitutes(req).subscribe(data => {
      this.institutes = data;
    });
  }

  getCourses() {
    const typeId = this.filterForm.get('courseType')?.value;
    this.courses = [];
    this.filterForm.get('course')?.setValue(null);

    this.seatMatrixService.getCourses(typeId).subscribe(data => {
      this.courses = data;
    });
  }

  CalculateSeat(form: any) {
    (form as FormGroup).patchValue(
      {
        total: Number(form.get('stateNonRural')?.value) + Number(form.get('stateRural')?.value) + Number(form.get('otherNonRural')?.value) + Number(form.get('otherRural')?.value)
          + Number(form.get('ci_ct_na_ur')?.value) + Number(form.get('ci_ct_pb_ur')?.value) + Number(form.get('ci_ct_ch_ur')?.value)
          + Number(form.get('ci_ct_hr_ur')?.value) + Number(form.get('ci_ct_hp_ur')?.value) + Number(form.get('ci_ct_jk_ur')?.value)
      }
    )
  }
}
